# Drifting-Alex

A personal, local-first build of [Drifting](https://github.com/chihumyum/Drifting)
— the cross-platform, AI-native novel-writing app — with a different editor, a
different typeface and an extra AI subscription.

**Drifting-Alex is not the official Drifting app and is not endorsed by its
maintainer.** It is a fork of the AGPL-3.0-or-later source; the original
project, its documentation and its releases live at
[chihumyum/Drifting](https://github.com/chihumyum/Drifting).

## What this build changes

| | Drifting | Drifting-Alex |
| --- | --- | --- |
| Chapter prose editor | TipTap surface | [Textus](https://github.com/alexzeng2014/Textus)'s Markdown editor (Milkdown / ProseMirror) |
| Typeface | Newsreader · Noto Serif SC · Source Sans 3 | Sarasa Gothic SC (更纱黑体) throughout |
| AI providers | DeepSeek, Anthropic, OpenAI, ChatGPT subscription | the same, plus **OpenCode Go** with **GLM-5.3** as its writing default |
| Network | optional account sync and hosted AI | local-only: no account, no hosted service |

The chapter title and summary fields, the chapter tree, outline, comments,
history, export and Drifting's own Agent all stay as they were. What the
chapter surface gains is Textus's editing behaviour — inline Markdown syntax
reveal, math, Mermaid, code blocks, tables, CJK-friendly emphasis and the
`markdownUpdated` document contract — while Drifting remains the owner of the
stored chapter, its outline and its word count.

### The prose bridge

A chapter is stored as TipTap JSON. Drifting-Alex converts it to Markdown for
the editor and converts every edit back through
`materializeCanonicalNodeProse`, Drifting's own projection, so word counts and
outlines stay canonical. Drifting's prose profile deliberately has no lists,
code blocks or tables; if a chapter contains them, their words are kept as
paragraphs rather than dropped.

### Vendored editor

`src/renderer/textus/` is a pruned copy of Textus's `src/editor` and its
supporting modules (MIT, © CatVinci Studio), adapted to run inside Drifting.
Textus's AI, plugins, native host calls and document store are not part of
this copy; `src/renderer/textus/platform/` deliberately answers from stubs.

## Building

Requires Node 22.23.1+ and pnpm 10, plus a Rust toolchain for the Tauri shell.

```bash
pnpm install
pnpm typecheck
pnpm tauri:dev
```

`.env.local` selects the local-only build used here:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_LOCAL_ONLY_MODE=true
VITE_REQUIRE_AUTH=false
VITE_AI_TRANSPORT=direct
```

## Using OpenCode Go

Settings → Models & API → **OpenCode Go**, paste the API key from your OpenCode
Go subscription, then pick the provider and model (GLM-5.3 by default) from the
configuration menu in the Agent composer. The key is written only to this
device's system keychain.

## Licence and attribution

Drifting-Alex is distributed under the GNU Affero General Public License v3.0
or later, the same licence as Drifting. The original copyright notices,
`LICENSE`, `NOTICE` and `THIRD_PARTY_NOTICES.md` are kept. Textus's editor
modules are MIT-licensed; their notice is in
`src/renderer/textus/THIRD_PARTY_NOTICES.md`. Sarasa Gothic SC is OFL-1.1;
see `src/assets/fonts/sarasa-gothic-sc/LICENSE`.
