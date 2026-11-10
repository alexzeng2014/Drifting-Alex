# Vendored Textus editor

`src/renderer/textus/` is a pruned copy of the editor from
[alexzeng2014/Textus](https://github.com/alexzeng2014/Textus), itself a fork of
[CatVinci-Studio/Textus](https://github.com/CatVinci-Studio/Textus).

Copyright (c) 2026 CatVinci Studio. MIT License — the full text is in
[`LICENSE`](./LICENSE) beside this file.

## What was copied

- `editor/` — the Milkdown/ProseMirror editor: Markdown presets, input rules,
  math, Mermaid, code blocks, tables, wikilinks, CJK-friendly emphasis, block
  keys and the rest of the editing behaviour.
- `ui/`, `utils/`, `clipboard/`, `lazy/`, `i18n/`, `prefs/` — the supporting
  modules those files import.
- `theme/content-base.css`, `editor/milkdown-theme.css` — the document styles.

## What was changed for Drifting-Alex

- `platform/`, `storage/` and `prefs/SettingsContext.ts` are new stand-ins:
  Drifting owns documents, assets, settings and AI, so Textus's native IPC,
  settings store and AI paths are not part of this copy. Each stand-in says so
  at the top of its file.
- Files Textus's app shell needed (`document/`, the settings store, the plugin
  host) were removed, and the plugin chain was left as the editor needs it.
- Small type-only patches where Drifting's stricter TypeScript settings differ
  (annotated callback parameters, an explicit null check). No behaviour was
  changed by them.

Textus's own AI, plugins, updater and native commands are **not** included and
are not reachable from this copy.
