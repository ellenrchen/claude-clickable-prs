import type { EngineInterface, Register } from 'claude-code'

import { githubSlug, linkify, parseRepos } from './linkify'

const origins = new Map<string, string | undefined>()

// The working directory's GitHub origin, looked up once per directory.
async function origin($: EngineInterface): Promise<string | undefined> {
  const cwd = await $.session.cwd()
  if (!origins.has(cwd)) {
    const ran = await $.process.run(['git', '-C', cwd, 'remote', 'get-url', 'origin']).catch(() => undefined)
    origins.set(cwd, ran && ran.exitCode === 0 ? githubSlug(ran.stdout) : undefined)
  }
  return origins.get(cwd)
}

export const register: Register = (on, options) => {
  const configured = String(options.defaultRepo ?? '').trim()
  const list = String(options.repos ?? '')

  on('ui.render', { component: 'AssistantMessage' }, async ($, e: any, next) => {
    const text: string = e.props.text
    if (!text.includes('#')) return next(e)
    const repos = parseRepos(list, configured || (await origin($)))
    const out = linkify(text, repos)
    return out === text ? next(e) : next({ ...e, props: { ...e.props, text: out } })
  })
}
