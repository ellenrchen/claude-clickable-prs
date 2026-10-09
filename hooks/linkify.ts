// Turns pull request references in markdown into GitHub links, leaving code, URLs and existing links alone.

export type Repos = {
  // owner/repo that a bare #123 links to.
  fallback?: string
  // Lowercase repo name to owner/repo, for "web-app #456".
  byName: ReadonlyMap<string, string>
}

const REPO = /^[\w.-]+\/[\w.-]+$/
// Three digits or more, so a bare "step #12" stays prose.
const NUM = String.raw`#(?<num>\d{3,})(?![\w-])`
const TOKEN = new RegExp(
  [
    String.raw`!?\[[^\]\n]*\]\([^)\s]*\)`, // existing link or image
    String.raw`<[a-z]+:[^>\s]+>`, // autolink
    String.raw`(?<ticks>\x60+)[^\x60\n]+?\k<ticks>(?!\x60)`, // code span
    String.raw`[a-z][\w+.-]*://[^\s<>()\[\]\x60"']+`, // URL
    String.raw`(?<![\w/.-])(?<slug>[\w.-]+/[\w.-]+)#(?<onum>\d+)(?![\w-])`, // owner/repo#123
    String.raw`(?<![\w/.-])(?<name>[\w.-]+) ?${NUM}`, // name #123
    String.raw`(?<![\w&/])${NUM}`, // bare #123
  ].join('|'),
  'gi',
)

type Groups = { slug?: string; onum?: string; name?: string; num?: string }

const url = (slug: string, num: string) => `https://github.com/${slug}/pull/${num}`

// Parses the comma-separated owner/repo setting, skipping anything else.
export function parseRepos(list: string, fallback?: string): Repos {
  const slugs = [fallback, ...list.split(',')].map(s => s?.trim() ?? '').filter(s => REPO.test(s))
  const byName = new Map<string, string>()
  for (const slug of slugs) {
    const name = slug.split('/')[1]!.toLowerCase()
    if (!byName.has(name)) byName.set(name, slug)
  }
  return { fallback: fallback && REPO.test(fallback) ? fallback : undefined, byName }
}

// The owner/repo of a GitHub remote URL, in https or ssh form.
export function githubSlug(remote: string): string | undefined {
  const m = /github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/.exec(remote.trim())
  return m?.[1]
}

function linkifyProse(text: string, repos: Repos): string {
  return text.replace(TOKEN, (match: string, ...rest: unknown[]) => {
    const g = rest[rest.length - 1] as Groups
    if (g.onum) return `[${match}](${url(g.slug!, g.onum)})`
    if (!g.num) return match
    const named = g.name ? repos.byName.get(g.name.toLowerCase()) : undefined
    if (named) return `[${match}](${url(named, g.num)})`
    if (!repos.fallback) return match
    // A word before the number that names no repo stays prose; only the number links.
    const ref = `#${g.num}`
    return `${match.slice(0, match.length - ref.length)}[${ref}](${url(repos.fallback, g.num)})`
  })
}

export function linkify(markdown: string, repos: Repos): string {
  // Odd-indexed parts are fenced code blocks.
  const parts = markdown.split(/(^ {0,3}(?:```|~~~)[^\n]*\n[\s\S]*?(?:^ {0,3}(?:```|~~~)[ \t]*$|(?![\s\S])))/m)
  return parts.map((part, i) => (i % 2 ? part : linkifyProse(part, repos))).join('')
}
