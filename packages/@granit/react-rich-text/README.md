# @granit/react-rich-text

Shared rich-text editor for the Granit framework — a generic
[TipTap](https://tiptap.dev)-based WYSIWYG that takes HTML in and emits HTML out.
It is the **base every Granit HTML editor composes**: feature packages (templating,
dashboards, …) wrap it and inject their own controls instead of each shipping a
fork of the same TipTap setup.

The component is headless of any backend — it only knows HTML strings. Wire
`value` / `onChange` to your form state.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. A consumer
declares these peers:

- `@granit/react-ui` — toolbar primitives (`Button`, `Tooltip`, `DropdownMenu`, …).
- `@granit/react-localization` — `useTranslation` for the toolbar labels.
- `@granit/utils` — the `cn` class-merge helper.
- `@tiptap/react` + `@tiptap/starter-kit` + the `@tiptap/extension-*` used here
  (`placeholder`, `task-list`, `task-item`, `text-align`).
- `lucide-react`, `react` (`^19`), `react-dom`.

## Usage

```tsx
import { RichTextEditor, type RichTextEditorHandle } from '@granit/react-rich-text';
import { useRef, useState } from 'react';

function MyEditor() {
  const [html, setHtml] = useState('<p>Hello</p>');
  const ref = useRef<RichTextEditorHandle>(null);

  return (
    <RichTextEditor
      ref={ref}
      value={html}
      onChange={setHtml}
      placeholder="Write something…"
      // Right-aligned slot for host-specific controls (variable picker, code toggle…).
      toolbarExtras={
        <button onClick={() => ref.current?.insertAtCursor('{{ now }}')}>+ var</button>
      }
    />
  );
}
```

## Public API

| Symbol                                              | Kind      | Purpose                                                                                                                                         |
| --------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `RichTextEditor`                                    | component | The editor. Props: `value` / `onChange` (HTML), `readOnly`, `placeholder`, `ariaLabel`, `toolbarExtras`. `forwardRef` exposes `insertAtCursor`. |
| `RichTextEditorHandle`                              | type      | Imperative handle — `{ insertAtCursor(text: string): void }`.                                                                                   |
| `RichTextEditorProps`                               | type      | Props of `RichTextEditor`.                                                                                                                      |
| `richTextTranslationsEn` / `richTextTranslationsFr` | const     | i18next bundles for the toolbar labels (`RichText.*`).                                                                                          |

## Notes

- **HTML round-trip.** `onChange` emits `editor.getHTML()`; external `value`
  changes are synced without a cursor jump (guarded against StrictMode teardown).
- **Toolbar.** Bold / italic / underline / strike, headings, alignment, lists
  (bullet / ordered / task), blockquote, link, undo / redo — plus the
  `toolbarExtras` slot. The bundled StarterKit configures `Link` and `Underline`.
- **Labels.** Every label passes a `defaultValue`, so the editor works without
  registering the i18n bundle; register `richTextTranslations*` to localize.
- **Notion-style editing.** Typing `/` opens a block menu (headings, lists,
  quote, code block); selecting text shows a bubble toolbar (bold / italic /
  underline / strike). The slash extension (`SlashCommand`) and the default
  block list (`createDefaultSlashItems`) are exported so apps can add their own
  blocks. Built on the free TipTap `@tiptap/suggestion` + `tippy.js` — no
  TipTap Pro / Cloud dependency.
