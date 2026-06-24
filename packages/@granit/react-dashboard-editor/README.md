# @granit/react-dashboard-editor

Headless **dashboard composer** primitives for Granit — a drag-and-drop,
reorderable, resizable widget grid built on
[dnd-kit](https://dndkit.com), plus the pure definition-mutation helpers that
keep edits round-trippable through the backend's widget-CRUD endpoints. The
frontend half of the dashboard composer feature (EPIC #1366, story B5-C).

This is the **edit-mode React layer**. It mirrors the read-mode `<RenderedDashboard>`
from [`@granit/react-dashboards`](../react-dashboards) — same auto-flow CSS
grid, same `WidgetRegistry`-driven renderers — and adds drag-reorder,
drag-resize, an add-widget palette, and per-kind config forms. It renders no
chrome: open/close state, side-panel containers, save buttons, and React Query
persistence all live one layer up. The package holds no Axios calls, no React
Query hooks, and no DTOs — those belong to the sibling packages below.

The dashboards module is a four-package split over the .NET `Granit.Dashboards`
backend (contract: `contracts/openapi/dashboards.json`):

- [`@granit/dashboards`](../dashboards) — framework-agnostic core:
  `DashboardDefinition`, the `WidgetDefinition` discriminated union, layout
  primitives (`WIDGET_SIZE`), and the built-in Markdown / Image / Text widget
  shapes. Source of every type this package consumes.
- [`@granit/react-dashboards`](../react-dashboards) — the read-mode renderer:
  `<RenderedDashboard>`, `WidgetRenderer`, the `WidgetRegistry` provider, and the
  built-in widget renderers. Re-used here for in-grid widget rendering.
- `@granit/react-dashboard-editor` (this package) — headless edit-mode
  primitives + pure definition mutators.
- [`@granit/react-ui-dashboards`](../react-ui-dashboards) — admin UI kit: the
  dashboard catalogue, the rich per-dashboard composer page, status/drift
  badges, and lifecycle dialogs. Composes this package with the foundation UI.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must
declare these peers:

- `@granit/dashboards` — `DashboardDefinition` / `WidgetDefinition` / `WidgetSize`
  and the `WIDGET_SIZE` constants every helper and form operates on.
- `@granit/react-dashboards` — supplies `WidgetRenderer`, the dashboard context,
  and `resolveEffectiveLayout`, re-used to render widgets in edit mode.
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — the drag-reorder /
  drag-resize engine behind `<EditableDashboard>` and `<SortableWidgetCell>`.
- `react-i18next` (`^17`) — `<WidgetPalette>`, `<WidgetConfigDrawer>`, and the
  built-in config forms resolve labels via `useTranslation()`.
- `react` (`^19`).

## Quick start

`<EditableDashboard>` is presentational and controlled: it takes a
`DashboardDefinition`, renders the editable grid, and emits a fresh definition
through `onChange` after every reorder or resize. The parent owns local state
and persistence (typically a React Query mutation against the widget-CRUD
endpoints). Pair it with `<WidgetPalette>` to add widgets and a
`<WidgetConfigDrawer>` to edit kind-specific fields.

```tsx
import { useState } from 'react';
import {
  EditableDashboard,
  WidgetPalette,
  WidgetConfigDrawer,
  addWidget,
  removeWidget,
  updateWidget,
  defaultWidgetCatalog,
  defaultWidgetConfigFormRegistry,
} from '@granit/react-dashboard-editor';
import { WidgetRegistryProvider } from '@granit/react-dashboards';
import type { DashboardDefinition, WidgetDefinition } from '@granit/dashboards';

function DashboardComposer({ initial }: { initial: DashboardDefinition }) {
  const [definition, setDefinition] = useState(initial);
  const [editing, setEditing] = useState<WidgetDefinition | null>(null);

  return (
    // The same registry that drives read-mode rendering renders cells here.
    <WidgetRegistryProvider>
      <WidgetPalette
        catalog={defaultWidgetCatalog}
        onAdd={(entry) => setDefinition((d) => addWidget(d, entry))}
      />

      <EditableDashboard definition={definition} onChange={setDefinition} />

      {editing ? (
        <WidgetConfigDrawer
          widget={editing}
          registry={defaultWidgetConfigFormRegistry}
          // updateWidget preserves slug + position; the form only edits
          // kind-specific fields.
          onChange={(next) => setDefinition((d) => updateWidget(d, next.slug, next))}
          header={
            <button type="button" onClick={() => setDefinition((d) => removeWidget(d, editing.slug))}>
              Delete
            </button>
          }
        />
      ) : null}
    </WidgetRegistryProvider>
  );
}
```

Every helper is pure and returns a **new** `DashboardDefinition` whose widgets
carry a dense, contiguous, 0-based `position` rank — matching the backend
invariant on `WidgetInstance.Position`, so a save round-trip needs no
re-normalisation pass. When a mutation is a no-op (unknown slug, identical
size, source === target) the helper returns the **same reference**, so callers
can diff cheaply with referential equality before persisting.

Downstream domain packages contribute their own widget kinds by composing
catalogs and form registries — built-ins win or lose by registration order
(last wins on a `type` collision):

```tsx
import {
  composeCatalogs,
  composeWidgetConfigFormRegistries,
  defaultWidgetCatalog,
  defaultWidgetConfigFormRegistry,
} from '@granit/react-dashboard-editor';
import { analyticsWidgetCatalog, analyticsConfigForms } from '@granit/react-analytics';

const catalog = composeCatalogs(defaultWidgetCatalog, analyticsWidgetCatalog);
const formRegistry = composeWidgetConfigFormRegistries(
  defaultWidgetConfigFormRegistry,
  analyticsConfigForms
);
```

## Public API

| Symbol                              | Kind      | Purpose                                                                     |
| ----------------------------------- | --------- | --------------------------------------------------------------------------- |
| `EditableDashboard`                 | component | Controlled edit-mode grid: dnd-kit reorder + drag-resize, emits `onChange`  |
| `EditableDashboardProps`            | type      | `{ definition, onChange, className?, rowHeight? }`                          |
| `SortableWidgetCell`                | component | One sortable cell with drag handle + optional resize handle                 |
| `SortableWidgetCellProps`           | type      | Cell props (`id`/slug, `size`, `onResize`, grid metrics)                    |
| `WidgetPalette`                     | component | Click-to-add toolbar listing catalog entries; calls `onAdd(entry)`          |
| `WidgetPaletteProps`                | type      | `{ catalog, onAdd, className? }`                                            |
| `WidgetConfigDrawer`                | component | Picks the registered form for `widget.type` and renders it                  |
| `WidgetConfigDrawerProps`           | type      | `{ widget, onChange, registry, className?, header? }`                       |
| `MarkdownConfigForm`                | component | Built-in form for `MarkdownWidgetDefinition` (edits its content key)        |
| `TextConfigForm`                    | component | Built-in form for `TextWidgetDefinition` (content key + `style` enum)       |
| `ImageConfigForm`                   | component | Built-in form for `ImageWidgetDefinition` (source, alt key, `fit`)          |
| `reorderWidgets`                    | fn        | Pure: move source slug to target slug, dense-rerank `position`              |
| `resizeWidget`                      | fn        | Pure: clamp + apply a new size to one widget by slug                        |
| `addWidget`                         | fn        | Pure: append a widget from a catalog entry (mints a unique slug)            |
| `removeWidget`                      | fn        | Pure: drop a widget by slug, dense-rerank the rest                          |
| `updateWidget`                      | fn        | Pure: replace a widget by slug, preserving its slug + position              |
| `composeCatalogs`                   | fn        | Merge catalog arrays; later entries win on `type` collision (frozen)        |
| `defaultWidgetCatalog`              | const     | Framework-shipped catalog: markdown / text / image entries (frozen)         |
| `WidgetCatalogEntry`                | type      | Palette descriptor: `type`, label key, icon key, default size, factory      |
| `composeWidgetConfigFormRegistries` | fn        | Merge form registries; later entries win on `type` collision (frozen)       |
| `defaultWidgetConfigFormRegistry`   | const     | Framework-shipped form registry for markdown / text / image (frozen)        |
| `WidgetConfigForm`                  | type      | `ComponentType<WidgetConfigFormProps<T>>` — a kind-specific form            |
| `WidgetConfigFormProps`             | type      | `{ widget, onChange }` passed to every config form                          |
| `WidgetConfigFormRegistry`          | type      | `Readonly<Record<type, WidgetConfigForm>>`                                  |

## Caveats

- **Headless by design.** Components emit raw `data-slot` markup and Tailwind
  utility classes — no Sheet/Drawer/Dialog chrome, no open/close state, no save
  button. Apps supply the container and the persistence pipeline; the admin
  composition lives in [`@granit/react-ui-dashboards`](../react-ui-dashboards).
- **Slug is immutable identity.** A widget's `slug` is its primary key, its DnD
  identity, and the prefix of its localization keys. `updateWidget` and the
  config-form surface deliberately cannot change it (nor `position`); slug
  minting is owned by `addWidget` via the catalog entry's `type`.
- **Content lives in i18n, not the dashboard JSON.** The built-in forms edit
  localization **keys** (`contentLocalizationKey`, `altLocalizationKey`), not
  literal text — the body is a tenant-overridable translation. Apps wanting an
  inline content editor register their own form via
  `composeWidgetConfigFormRegistries`.
- **Resize needs live grid metrics.** `<SortableWidgetCell>` only shows a resize
  handle when `onResize` plus `columnPx` / `rowPx` are supplied;
  `<EditableDashboard>` derives `columnPx` from a `ResizeObserver`. Where
  `ResizeObserver` is unavailable (JSDOM, older SSR runtimes) the editor still
  renders and reorder still works — only the resize gesture is inert. Width is
  clamped to `[1, layout.columns]`, height to `[1, 12]`.
- **Unknown widget kinds.** A `type` with no registered renderer surfaces the
  framework's "Unknown widget type" placeholder in the grid (there is no
  editor-specific fallback); a `type` with no registered config form surfaces a
  localized fallback message in `<WidgetConfigDrawer>` — authoring and rendering
  stay symmetric.

## Out of scope

- **Read-mode rendering** — `<RenderedDashboard>`, `WidgetRenderer`, and the
  `WidgetRegistry` belong to [`@granit/react-dashboards`](../react-dashboards).
- **DTOs, HTTP transport, and persistence** — the dashboard/widget wire shapes
  come from [`@granit/dashboards`](../dashboards); saving is the host app's
  React Query mutation, not this package.
- **Admin chrome and lifecycle** — the composer page, catalogue, drift badges,
  and publish/archive dialogs live in
  [`@granit/react-ui-dashboards`](../react-ui-dashboards).
- **Drag-from-palette** — dropping a palette button at a specific grid position
  is deferred; `<WidgetPalette>` is click-to-add only. Apps wanting drag-to-add
  wrap their own `<DndContext>` around the editor and palette.

## License

Apache-2.0
