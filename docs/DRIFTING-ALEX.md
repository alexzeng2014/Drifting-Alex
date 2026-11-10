# Drifting-Alex — what this fork changes

Drifting-Alex is a personal build of [Drifting](https://github.com/chihumyum/Drifting).
This page records exactly what was changed, where the seams are, and what is
still rough, so the next person (or the next session) does not have to
rediscover it.

## 1. Identity

| Thing | Value |
| --- | --- |
| Product name | `Drifting-Alex` (`package.json`, `tauri.conf.json`, window titles) |
| Bundle identifier | `cc.driftingalex.client` (was `cc.drifting.client`) |
| Deep-link scheme | `drifting-alex` (was `drifting`) |
| Icon | generated ink-stroke mark: `src/assets/icon-master.png`, `icon.png`, `icon.ico` |
| Network | local-only build (`.env.local`): no account, no hosted service |

`icon.icns` (macOS) is still the upstream file: this build is Windows-only and
the .icns step needs macOS tooling (`sips`, `iconutil`).

## 2. Typeface — Sarasa Gothic SC (更纱黑体)

- `src/assets/fonts/sarasa-gothic-sc/` holds Regular, Italic, Bold and
  BoldItalic as WOFF2, converted from the official OFL release
  (v1.0.43). `provenance.json` records every hash; `LICENSE` is the OFL text.
- `src/styles/interface-fonts.css` declares the four `@font-face` rules and
  makes `--font-sarasa-gothic` the structure, UI and mono fallback families.
- `src/styles/index.css` points the prose roles (`--font-prose-system-serif`,
  `--font-prose-system-sans`, `--font-ui`) at Sarasa Gothic SC, so new
  documents and the default manuscript font are both Sarasa.
- Users can still change the manuscript font in Settings; Sarasa is the
  default, not a lock.

`pnpm ui:fonts:check` (the upstream QA gate) records upstream's font roles and
will not match this build — that check is expected to be re-recorded, not
"fixed".

## 3. AI — OpenCode Go with GLM-5.3

Provider id `opencode-go`, OpenAI-compatible wire, endpoint
`https://opencode.ai/zen/go/v1`.

| Layer | File |
| --- | --- |
| Provider union | `src/renderer/lib/agent/protocol.ts` |
| Models, BYOK wiring, defaults | `src/renderer/lib/agent/runtime/agent-provider-contract.ts` |
| Chat-completions adapter | `src/renderer/lib/ai/client/providers/opencode-go.ts` (extends `openai-runtime.ts`) |
| Client factory | `src/renderer/lib/ai/client/build-default-client.ts` |
| Keychain ids | `src/renderer/lib/byok-keychain.ts` (`byok.opencode-go`) |
| Native model list | `src-tauri/src/byok_models.rs` |
| Settings UI | `src/renderer/features/settings/panels/IntelligenceSettingsPanels.tsx` |
| First-run guide | `src/renderer/features/agent/onboarding/` |
| CSP allow-list | `src-tauri/tauri.conf.json` → `https://opencode.ai` |

Bundled models, in menu order: **glm-5.3** (default), deepseek-v4-pro,
deepseek-v4.1-flash, kimi-k2.7-code, glm-5.2. The subscription's own `/models`
list replaces this when the key works.

The adapter never sends `reasoning_effort` or an output cap: the endpoint takes
no reasoning switch, and (as Textus's generic client does) it publishes its own
completion ceiling, so neither field is sent.

### Why OpenCode Go requests leave from native code

The endpoint is not usable from the WebView:

- its CORS preflight (`OPTIONS`) answers **404**, so any renderer `fetch` with
  an `Authorization` header is blocked before the request exists;
- it rejects a request without an `x-opencode-session` routing id
  (`400 MissingSessionID`), a header Textus adds in its Rust client.

So `src-tauri/src/openai_responses.rs` also serves BYOK completions:
`byok_completion_stream` / `byok_completion_cancel` read the key from secure
storage, add `Authorization: Bearer` and a per-run
`x-opencode-session: drifting-alex-<hex>`, and relay the response as
start/chunk/finish channel events. `src/renderer/platform/tauri.ts` turns those
events into a streaming `Response`, and `opencode-go.ts` hands that
`Response`-producing function to the OpenAI SDK as its `fetch`. The SDK, the
driver and the Agent runtime are unchanged.

Any future provider whose endpoint refuses browser requests goes through the
same pair of commands rather than a second transport.

Test connection (Settings → Models & API) uses the same path, so it exercises
the real wire.

## 4. Chapter editor — Textus

The chapter prose surface is Textus's Markdown editor (Milkdown/ProseMirror).

- `src/renderer/textus/` — pruned copy of Textus's `src/editor` plus the
  modules it needs (MIT, see `THIRD_PARTY_NOTICES.md` in that folder).
  `platform/`, `storage/` and `prefs/SettingsContext.ts` are stand-ins: Drifting
  owns documents, settings and AI.
- `src/renderer/components/editor/TextusChapterEditor.tsx` — the surface.
  Title and summary fields stay Drifting's; the body is the Textus editor.
- `src/renderer/components/editor/textus-chapter.css` — Drifting's manuscript
  typography (family, size, leading, ink) applied to the `.milkdown` root.
- `src/renderer/lib/chapter-markdown.ts` — the bridge.
- `src/renderer/views/NodeEditorView.tsx` — now mounts `TextusChapterEditor`.

### The data contract

A chapter is stored as TipTap JSON. The editor opens with
`pmJsonToMarkdown(content)`; each edit is debounced 400 ms, converted back
with `markdownToPmJson`, and handed to `materializeCanonicalNodeProse`, so
`contentJson`, `outlineJson` and `wordCount` are Drifting's own canonical
projection. Nothing else in the app learns a new document format.

Drifting's `prose` schema has paragraphs, headings 1–3, block quotes,
horizontal rules, hard breaks and bold / italic / strike / underline / link /
inline-code. Markdown that means more than that (lists, code blocks, tables)
keeps its **words** as paragraphs on save; the structure is not stored. This is
deliberate: the alternative is silently losing text.

Edits the Agent makes land in Yjs; the surface watches the stored content and
replaces the document when a newer one arrives.

### What the chapter surface does not have yet

- Drifting's inline comment / review decorations on the prose (no
  `AgentDiffDecoration`, no selection comment bar on this surface). The other
  entity editors keep theirs; `comment-marks-toggle.acceptance.test.ts` records
  the chapter view as the one exception instead of asserting a feature it no
  longer has.
- The `patch` card flow and the "typewriter" scroll mode.
- Entity name auto-linking inside the prose: `entityLink` marks are not
  representable in Markdown, so they are not preserved through an edit.
- Spellcheck/grammar from Textus (Textus AI is not part of this build).

`VirtualChapterRow` (the all-chapters scroll view) still uses Drifting's TipTap
surface, so the two views edit the same stored JSON by different means.

## 5. Building on Windows without Visual Studio

This machine has no MSVC. The Tauri shell is built with Rust's
`x86_64-pc-windows-gnu` toolchain plus a portable MinGW for the C
dependencies:

```
RUSTFLAGS="-C linker=rust-lld"
PATH += <w64devkit>/bin        # gcc.exe for cc-rs (ring and friends)
```

`dlltool.exe` (with `as.exe` beside it) satisfies the windows-gnu import-library
step. `cargo check` and the renderer build are the gates used here; a signed
installer is not produced by this setup.

### Shipping the executable

Use the Tauri CLI, not `cargo build` directly — a plain `cargo build --release`
still bakes the dev URL in:

```
pnpm exec tauri build --no-bundle
```

The GNU toolchain links WebView2 **dynamically**: `cargo` leaves
`WebView2Loader.dll` next to `drifting.exe` in `target/release/`, and the app
fails with "WebView2Loader.dll was not found" if the executable is moved away
from it. Every packaged download therefore contains both:

```
Drifting-Alex.exe
WebView2Loader.dll      # Microsoft, x64, from the WebView2 build
README.txt              # how to run it, in Chinese
```

An MSVC build links `WebView2LoaderStatic.lib` instead and does not need the
DLL; if a compiler-and-linker toolchain is ever installed, switch the target to
`x86_64-pc-windows-msvc` and the extra file goes away.
