import { expect, test } from 'claude-code/testing'

import { githubSlug, linkify, parseRepos } from '../hooks/linkify'

const DUKE = parseRepos('cameron/crazies, cameron/web-app', 'cameron/indoor-stadium')
const PR = (slug: string, n: number) => `https://github.com/${slug}/pull/${n}`

test('a bare number links to the default repo', () => {
  expect(linkify('Coach K merged #130178.', DUKE)).toBe(`Coach K merged [#130178](${PR('cameron/indoor-stadium', 130178)}).`)
})

test('a named repo before the number picks that repo, with or without a space', () => {
  expect(linkify('(web-app #25515, Crazies#1886)', DUKE)).toBe(
    `([web-app #25515](${PR('cameron/web-app', 25515)}), [Crazies#1886](${PR('cameron/crazies', 1886)}))`,
  )
})

test('owner/repo#n links even with nothing configured', () => {
  expect(linkify('see blue-devils/roster#12', parseRepos(''))).toBe(
    `see [blue-devils/roster#12](${PR('blue-devils/roster', 12)})`,
  )
})

test('a word that names no repo stays prose; only the number links', () => {
  expect(linkify('PR #134371', DUKE)).toBe(`PR [#134371](${PR('cameron/indoor-stadium', 134371)})`)
})

test('with no default repo a bare number stays prose', () => {
  expect(linkify('merged #130178', parseRepos('cameron/web-app'))).toBe('merged #130178')
})

test('code, URLs, links, colors, short numbers and headings stay as written', () => {
  const text =
    '# Title\n`#130178` and https://github.com/cameron/web-app/pull/1#123456 and [x](#9999) color #ffaa00 step #12 #123abc\n```\n#130178\n```\n'
  expect(linkify(text, DUKE)).toBe(text)
})

test('a GitHub remote resolves to owner/repo in https and ssh form', () => {
  expect(githubSlug('git@github.com:cameron/indoor-stadium.git\n')).toBe('cameron/indoor-stadium')
  expect(githubSlug('https://github.com/cameron/web-app')).toBe('cameron/web-app')
  expect(githubSlug('https://gitlab.com/cameron/web-app.git')).toBeUndefined()
})

function drawn(on: any) {
  const seen: { text?: string } = {}
  // Stands in for Claude Code's own drawing, which gets the rewritten text
  on('ui.render', { component: 'AssistantMessage' }, (t$: any, e: any) => {
    seen.text = e.props.text
    const { Text } = t$.ui.resolve(e)
    return h(Text, {}, e.props.text)
  })
  return seen
}

const REPLY = (text: string) => ({
  plugin: 'clickable-prs',
  surface: 'terminal',
  component: 'AssistantMessage',
  requestId: 'm1',
  props: { text, isFirstOfReply: true },
}) as const

test('a bare number links to the working directory origin when no default is set', async ($, on) => {
  on('session.cwd', () => ({ value: '/court' }))
  on('process.run', () => ({
    value: { exitCode: 0, stdout: 'git@github.com:cameron/indoor-stadium.git\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
  }))
  const seen = drawn(on)
  const ui = await $.ui.mount(REPLY('merged #134371') as any)
  expect(seen.text).toBe(`merged [#134371](${PR('cameron/indoor-stadium', 134371)})`)
  await ui.unmount()
})

test('the configured default repo wins over the origin', { options: { defaultRepo: 'cameron/crazies' } }, async ($, on) => {
  const seen = drawn(on)
  const ui = await $.ui.mount(REPLY('merged #134371') as any)
  expect(seen.text).toBe(`merged [#134371](${PR('cameron/crazies', 134371)})`)
  await ui.unmount()
})
