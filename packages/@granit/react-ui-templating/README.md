# @granit/react-ui-templating

Admin **UI feature kit** for the Granit **Templating** module — the visual layer
that turns Scriban template management into ready-to-mount admin screens. It ships
the template list (a query-driven grid with status badges, smart filters,
data-exchange import / export and a stats dashboard) plus the create / edit
workspace (zod-validated metadata form, a dual WYSIWYG / code editor with variable
& filter insertion, live HTML / PDF / Excel preview with reusable test-data sets,
lifecycle publish / unpublish, revision history and a side-by-side diff) and the
category manager.

This is the top **`react-ui` admin feature kit** layer: it renders. It composes the
headless [`@granit/react-templating`](../react-templating) (provider + TanStack
Query hooks) over the framework-agnostic core
[`@granit/templating`](../templating) (DTOs + Axios calls, mirror of the .NET
`Granit.Templating` module, contract `contracts/openapi/templating.json`), wired to
the foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)) and the data-exchange UI
([`@granit/react-ui-data-exchange`](../react-ui-data-exchange)). The three-package
split over the same backend is:

- [`@granit/templating`](../templating) — core: DTOs + Axios functions
  (`getRevision`, lifecycle calls, `TemplateLifecycleStatus`, …).
- [`@granit/react-templating`](../react-templating) — `TemplatingProvider` + query
  hooks (`useTemplate`, `useTemplateMutations`, `useTemplatePreview`, …).
- `@granit/react-ui-templating` (this package) — admin pages, components, forms.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. (Unlike the
default source-direct packages, this one also ships a `tsup` `dist/` build with a
`publishConfig` for `npm.pkg.github.com`.) A consumer mounts the pages under an
existing `GranitClientProvider` and must declare these peers:

- `@granit/react-templating`, `@granit/templating` — the headless layer + core
  DTOs the pages drive.
- `@granit/react-ui`, `@granit/react-ui-admin-kit` — foundation primitives, the
  query data table, smart-filter bar and sort selector.
- `@granit/react-query-engine`, `@granit/query-engine` — the query-driven grid
  (`QueryProvider`, `useQueryEndpoint`, `useSmartFilter`, `QueryConfig`).
- `@granit/react-data-exchange`, `@granit/react-ui-data-exchange` — import / export
  buttons and dialogs.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter` (the pages
  read translation keys, never literal strings).
- `@granit/logger`, `@granit/utils` — `createLogger` and `cn`.
- `react` / `react-dom` (`^19`), `react-router-dom` (`^7`), `react-hook-form`
  (`^7`) + `@hookform/resolvers` (`^5`), `zod` (`^4`), `class-variance-authority`,
  `lucide-react`, `diff` (`^9`), `next-themes`.
- TipTap (`@tiptap/react` + starter-kit and extensions) for the WYSIWYG editor and
  CodeMirror 6 (`codemirror`, `@codemirror/lang-html`, `@codemirror/state`,
  `@codemirror/theme-one-dark`) for the code editor — both lazy-loaded.
- `@tanstack/react-table` (`^8`) — column definitions for the grid.

## Quick start

The list / create / edit pages each wrap their own `TemplatingProvider config=
{TEMPLATING_CONFIG}` (no `client` baked in), so they only need a
`GranitClientProvider` higher in the tree to resolve the Axios client. Register the
shipped `Templates.*` i18n bundle, then route to the pages:

```tsx
import {
  TemplateListPage,
  TemplateCreatePage,
  TemplateEditPage,
  templatesTranslationsEn,
} from '@granit/react-ui-templating';
import { Route, Routes } from 'react-router-dom';

// Merge the package's Templates.* keys into the host i18n instance. Common.* and
// DataExchange.* keys are host-owned and must already be present in the app bundle.
i18n.addResourceBundle('en', 'translation', templatesTranslationsEn, true, true);

function TemplatingRoutes() {
  return (
    // Mount anywhere below a <GranitClientProvider>.
    <Routes>
      <Route path="/templating/templates" element={<TemplateListPage />} />
      <Route path="/templating/templates/new" element={<TemplateCreatePage />} />
      <Route path="/templating/templates/:name" element={<TemplateEditPage />} />
    </Routes>
  );
}
```

Compose the lower-level components directly when you need a custom screen — e.g. the
status badge plus a column factory for a bespoke grid:

```tsx
import {
  TemplateStatusBadge,
  createTemplateColumns,
  TemplateLifecycleActions,
} from '@granit/react-ui-templating';
import { useTranslation, useDateFormatter } from '@granit/react-localization';

function CustomGridHeader({ template }: { template: TemplateDetail }) {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const columns = createTemplateColumns({ t, onEdit, formatDate });
  return (
    <div className="flex items-center gap-3">
      <TemplateStatusBadge status="Published" />
      <TemplateLifecycleActions template={template} />
    </div>
  );
}
```

## Public API

| Symbol                     | Kind      | Purpose                                                            |
| -------------------------- | --------- | ------------------------------------------------------------------ |
| `TemplateListPage`         | component | Self-contained list route: query grid, dashboard, filters, I/O     |
| `TemplateCreatePage`       | component | Create route: metadata form + editor, saves a draft                |
| `TemplateEditPage`         | component | Edit route (`:name`): editor / preview / history tabs + lifecycle  |
| `TemplateForm`             | component | zod-validated metadata form (name, culture, layout, mime, content) |
| `TemplateEditor`           | component | Dual WYSIWYG (TipTap) / code (CodeMirror) editor; lazy-loaded      |
| `TemplateEditorHandle`     | type      | Imperative ref: `insertAtCursor(text)` into the active editor      |
| `TemplatePreview`          | component | Test-data panel + sandboxed HTML preview, PDF / Excel download     |
| `TemplateHistory`          | component | Revision timeline: pick two to compare, restore archived/published |
| `TemplateRevisionDiff`     | component | Dialog rendering a line diff between two revisions                 |
| `TemplateLifecycleActions` | component | Publish / unpublish / delete-draft buttons with confirm dialogs    |
| `TemplateStatusBadge`      | component | CVA badge for a `WorkflowLifecycleStatus` (Draft, Published, …)    |
| `TemplateDashboard`        | component | Four stat cards: total, drafts, published, category count          |
| `TemplateCategoriesDialog` | component | CRUD manager for template categories                               |
| `VariablePanel`            | component | Variables (global/model/enrichment), click to insert an expression |
| `createTemplateColumns`    | fn        | `ColumnDef<TemplateListItem>[]` factory for the query grid         |
| `useTestDataStore`         | hook      | Per-template named test-data sets in `localStorage` (see caveats)  |
| `templateFormSchema`       | const     | Zod schema for the metadata form                                   |
| `TemplateFormValues`       | type      | `z.infer` of `templateFormSchema`                                  |
| `TEMPLATING_CONFIG`        | const     | `TemplatingConfig` (base path, query-key prefix; no client)        |
| `QUERY_CONFIG`             | const     | `QueryConfig` for the list grid (templating/templates)             |
| `DEFAULT_PAGE_SIZE`        | const     | Initial grid page size (`20`)                                      |
| `templatesTranslationsEn`  | const     | English `Templates.*` i18n bundle                                  |
| `templatesTranslationsFr`  | const     | French `Templates.*` i18n bundle                                   |

## Out of scope / caveats

- **Headless logic lives below.** DTOs and Axios transport are
  [`@granit/templating`](../templating); the provider, query hooks and mutations
  (`useTemplate`, `useTemplateMutations`, `useTemplatePreview`,
  `useTemplateCategories`, `useTemplateVariables`, `useTemplateHistory`, …) are
  [`@granit/react-templating`](../react-templating). This package only renders them
  and never speaks HTTP directly except via the core `getRevision` helper used by
  the restore flow.
- **i18n is split by ownership.** The package ships only its `Templates.*` strings
  (`templatesTranslationsEn` / `templatesTranslationsFr`); the host registers them.
  `Common.*` and `DataExchange.*` keys are host-owned and must already exist in the
  app bundle, or labels render as raw keys.
- **API client injection.** The pages mount `TemplatingProvider` and `QueryProvider`
  with no `client`; both resolve the Axios client (CSRF / auth / tenant
  interceptors) from a `GranitClientProvider` higher in the tree via
  `@granit/react-api-client`. There is no way to pass a client through page props.
- **Routing assumptions.** The pages use `react-router-dom` and hard-code the
  `/templating/templates`, `/new` and `/:name` paths in their `Link` / `navigate`
  targets, and the export / import dialogs use fixed data-exchange definition names
  (`Showcase.TemplateExport` / `Showcase.TemplateImport`). Mount the routes at those
  paths and provision matching data-exchange definitions backend-side.
- **HTML preview is sandboxed, not trusted.** `TemplatePreview` renders the
  server-returned HTML in an `<iframe srcDoc sandbox="allow-same-origin">` (no
  `allow-scripts`), so preview markup cannot run JavaScript. Rendering itself
  (Scriban execution, PDF / Excel generation) happens server-side; the component
  only displays the result and triggers a blob download for binary formats.
- **Test-data sets are browser-local and not protected.** `useTestDataStore`
  persists named JSON test payloads in `localStorage` under a single
  `granit-showcase-admin:test-data` key, keyed by template name. They are
  unencrypted, per-browser, not synced, and shared across tabs via a `storage`
  event. Do not store real or sensitive data in preview test sets — treat them as
  throwaway developer fixtures.

## License

Apache-2.0
