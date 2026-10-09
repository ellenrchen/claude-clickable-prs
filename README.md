# Claude Clickable PRs

A Claude Code mod that turns the pull request references in Claude's replies, like `#123`, `web-app #456` or `owner/repo#789`, into GitHub links you can click from the terminal.

[![License](https://img.shields.io/github/license/ellenrchen/claude-clickable-prs)](LICENSE)

## Install

Inside Claude Code, run:

```
/plugin marketplace add ellenrchen/claude-clickable-prs
/plugin install clickable-prs
/reload-plugins
```

That's it. In a GitHub checkout, the next reply that mentions `#123` shows it as a link to that repo's pull request.

<details>
<summary><strong>Prefer the terminal?</strong></summary>

```bash
claude plugin marketplace add ellenrchen/claude-clickable-prs
claude plugin install clickable-prs@claude-clickable-prs
```

Then run `/reload-plugins` inside a session, or start a new one.

</details>

## What You See

Claude often cites pull requests by number, which the terminal draws as plain text:

```
● This came from #104209, and the web app side is web-app #25515.
```

With the mod, both are links, opened with Cmd-click or Ctrl-click as your terminal does:

- **`owner/repo#123`** always links to that repository.
- **`name #123` or `name#123`** links to the repository you listed under that name (see Settings). The name match ignores case.
- **A bare `#123`** links to the default repository: the one you set, or else the working directory's GitHub `origin`. With neither, it stays plain text.
- **A word that names no repository** (`PR #123`, `in #123`) stays as text, and only the number links.
- **Numbers under three digits stay plain**, so "step #12" isn't a link. `owner/repo#12` still links.
- **Code, code blocks, URLs, existing links, headings and colors like `#ffaa00` stay as written.**

## Settings

Set these in `/config`, under the plugin's options:

| Option | What it does | Example |
| --- | --- | --- |
| Default repository | `owner/repo` that a bare `#123` links to. Empty uses the working directory's GitHub `origin`. | `acme/backend` |
| Named repositories | Comma-separated `owner/repo` list. Writing a repository's name before the number picks it. | `acme/backend, acme/web-app, acme/mobile` |

The default repository and the working directory's `origin` count as named too, so `backend #123` works without listing it.

Set a default repository when you work from a folder that isn't a checkout, such as a parent folder holding several repositories.

## How It Works

Claude Clickable PRs is a [mod](https://code.claude.com/docs/en/plugins/mods/overview):

1. It hooks `ui.render` for `AssistantMessage`, the row that draws each text block of Claude's reply.
2. It rewrites the block's Markdown, turning each pull request reference into a `https://github.com/<owner>/<repo>/pull/<n>` link.
3. It hands the rewritten text to Claude Code's own renderer, which already makes web links clickable.
4. It only changes the drawing. The stored conversation, and what Claude reads, stay as they were.

## Security

Claude Clickable PRs makes no network requests and writes no files. When no default repository is set, it runs `git remote get-url origin` once per working directory to find the repository.

Run `claude plugin validate` on the repo to see every event it hooks and every call it makes.

## Requirements

- Claude Code v2.1.287 or later (mods support)
- A terminal that supports OSC 8 hyperlinks, such as Ghostty, iTerm2, kitty, WezTerm, or recent GNOME Terminal

## Limitations

- Every reference links to `/pull/<n>`. GitHub redirects an issue number there to the issue, so issues still open.
- Only github.com is supported.
- Tool rows and your own prompts aren't linked.
- Another mod that draws Claude's replies itself, rather than handing them on, can hide these links in the replies it draws.

## Development

```bash
git clone https://github.com/ellenrchen/claude-clickable-prs
cd claude-clickable-prs

# Load it for one session without installing
claude --plugin-dir .

# Check it and run the tests
claude plugin validate .
claude plugin test .
```

Claude Code writes the API types into `.claude-plugin/types/` the first time it loads the mod, and `tsc -p .` type-checks it from then on.

## License

MIT. See [LICENSE](LICENSE).
