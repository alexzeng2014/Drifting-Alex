# Drifting-Alex

A personal, local-first build of [Drifting](https://github.com/chihumyum/Drifting)
— the cross-platform, AI-native novel-writing app — with a different typeface
and an extra AI subscription.

**Drifting-Alex is not the official Drifting app and is not endorsed by its
maintainer.** It is a fork of the AGPL-3.0-or-later source; the original
project, its documentation and its releases live at
[chihumyum/Drifting](https://github.com/chihumyum/Drifting).

## What this build changes

| | Drifting | Drifting-Alex |
| --- | --- | --- |
| Typeface | Newsreader · Noto Serif SC · Source Sans 3 | Sarasa Gothic SC (更纱黑体) throughout |
| AI providers | DeepSeek, Anthropic, OpenAI, ChatGPT subscription | the same, plus **OpenCode Go** with **GLM-5.3** as its writing default |
| Network | optional account sync and hosted AI | local-only: no account, no hosted service |

The editor is Drifting's own TipTap surface, unchanged — chapters, comments,
review marks, the Agent's diff decorations, patch cards and typewriter
scrolling all behave as upstream. No Textus code is compiled into this build.

### Where the AI catalog comes from

The provider list follows [Textus](https://github.com/alexzeng2014/Textus)'s
catalogue, and OpenCode Go is ported from it: `glm-5.3`, `deepseek-v4-pro`,
`deepseek-v4.1-flash`, `kimi-k2.7-code` and `glm-5.2` are bundled, and the
subscription's own `/models` list (about thirty ids today) replaces them once a
key is stored. Its endpoint refuses browser requests, so those calls leave from
native code — `docs/DRIFTING-ALEX.md` explains why.

Two ways to choose the model: the **Agent model** dropdown on the provider's
row in Settings → Models & API, or the composer's model menu (which filters
long catalogues).

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
Go subscription, then pick a model from the dropdown on the same row (or from
the Agent composer's model menu). The key is written only to this device's
system keychain.

## Licence and attribution

Drifting-Alex is distributed under the GNU Affero General Public License v3.0
or later, the same licence as Drifting. The original copyright notices,
`LICENSE`, `NOTICE` and `THIRD_PARTY_NOTICES.md` are kept. Sarasa Gothic SC is
OFL-1.1; see `src/assets/fonts/sarasa-gothic-sc/LICENSE`.
