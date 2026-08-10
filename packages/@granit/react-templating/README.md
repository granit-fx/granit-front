# @granit/react-templating

React hooks + provider for the Granit **templating** module — listing, reading,
editing, previewing and publishing server-side render templates (email, document,
report bodies) with revision history, layouts, categories and a draft/publish
lifecycle. This is the **React hooks layer**: it wraps the framework-agnostic
Axios calls and DTOs from [`@granit/templating`](../templating) in TanStack Query
hooks behind a shared `TemplatingProvider` for client/base-path/query-key
configuration. It holds no rendering — the editor, list page, dialogs and badges
live one layer up.

The split is three packages over the same .NET `Granit.Templating` backend
(contract: `contracts/openapi/templating.json`):

- [`@granit/templating`](../templating) — framework-agnostic core: DTOs + Axios
  functions (`getTemplates`, `saveDraft`, `publishTemplate`, …), the
  `TemplateLifecycleStatus` enum and `TemplatingPermissions`.
- `@granit/react-templating` (this package) — React Query hooks + provider +
  query-key factory.
- [`@granit/react-ui-templating`](../react-ui-templating) — admin UI kit:
  list/create/edit pages, the template editor, category dialog, revision diff,
  status badge and i18n bundles.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/templating` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `@granit/query-engine` / `@granit/react-query-engine` (**optional**) — only
  needed for the query-driven list surface and the `/meta` metadata used by the
  `./testing` handlers.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-templating/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it. The provider throws if
no client is available from either `config.client` or a surrounding
`<GranitClientProvider>`; `basePath` defaults to `/api/v1/templating`.

```tsx
import { TemplatingProvider, useTemplates } from '@granit/react-templating';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return <TemplatingProvider config={{ client: useGranitClient() }}>{children}</TemplatingProvider>;
}

function TemplateList() {
  const { data, isLoading } = useTemplates({ page: 1, pageSize: 20 });
  if (isLoading) return null;
  return (
    <ul>
      {data?.items.map((t) => (
        <li key={t.name}>
          {t.name} — {t.currentStatus}
        </li>
      ))}
    </ul>
  );
}
```

Editing screens combine the detail query with the lifecycle mutations. Each
mutation invalidates the relevant query keys (detail, history, lifecycle, list) on
success, so the UI re-reads fresh server state:

```tsx
import { useTemplate, useTemplateMutations, useTemplatePreview } from '@granit/react-templating';

function TemplateEditor({ name }: { name: string }) {
  const { data: template } = useTemplate(name);
  const { saveDraft, publish } = useTemplateMutations();
  const preview = useTemplatePreview();

  return (
    <>
      <button onClick={() => saveDraft.mutate({ name, content: '<h1>Hi</h1>' })}>Save draft</button>
      <button onClick={() => publish.mutate({ name })}>Publish</button>
      <button onClick={() => preview.mutate({ name, request: { data: {} } })}>Preview</button>
      {preview.data && <iframe title="preview" srcDoc={preview.data.html} />}
    </>
  );
}
```

## Public API

| Symbol                         | Kind     | Purpose                                                               |
| ------------------------------ | -------- | --------------------------------------------------------------------- |
| `TemplatingProvider`           | provider | Supplies resolved client, base path, query-key prefix to hooks below  |
| `useTemplatingConfig`          | hook     | Read the resolved config; throws outside a provider                   |
| `useTemplates`                 | hook     | `GET .../templates` — paginated/filterable template list              |
| `useTemplate`                  | hook     | `GET .../templates/{name}` — detail (draft + published revisions)     |
| `useTemplateHistory`           | hook     | `GET .../templates/{name}/history` — paginated revision summaries     |
| `useTemplateRevision`          | hook     | `GET .../templates/{name}/revisions/{id}` — one revision's content    |
| `useTemplateLifecycle`         | hook     | `GET .../templates/{name}/lifecycle` — draft/publish status info      |
| `useTemplateVariables`         | hook     | `GET .../templates/{name}/variables` — declared bindable variables    |
| `useTemplateLayouts`           | hook     | `GET .../layouts` — available layout shells (5 min `staleTime`)       |
| `useTemplateCategories`        | hook     | `GET .../categories` — category list (5 min `staleTime`)              |
| `useTemplateCategoryMutations` | hook     | `create` / `update` / `delete` category mutations                     |
| `useTemplateMutations`         | hook     | `saveDraft` / `updateDraft` / `deleteDraft` / `publish` / `unpublish` |
| `useTemplatePreview`           | hook     | Render-to-text preview mutation (returns `{ html, … }`)               |
| `useTemplateBinaryPreview`     | hook     | Render-to-binary preview mutation (PDF, etc.)                         |
| `templateKeys`                 | const    | Query-key factory honoring the configured `queryKeyPrefix`            |
| `TemplatingConfig`             | type     | Provider input (optional `client` / `basePath` / `queryKeyPrefix`)    |
| `TemplatingProviderProps`      | type     | `{ config, children }`                                                |

`./testing` subpath (requires the optional `msw` peer): `createTemplatesHandlers`
(stateful MSW handlers, default base `/api/v1/templating`) and
`templateQueryMetadata` (the `/meta` payload for the list surface), plus the
`mockTemplateCategories` / `mockTemplatesData` fixtures, the `toTemplateListItem` /
`toTemplateDetail` converters and the `MockTemplate` type.

## Out of scope

- **Rendering** — the editor, list/create/edit pages, category dialog, revision
  diff, status badge and i18n bundles live in
  [`@granit/react-ui-templating`](../react-ui-templating). This package is
  headless.
- **DTOs, HTTP transport and the lifecycle enum** — owned by
  [`@granit/templating`](../templating) (mirror of `Granit.Templating`); hooks here
  only adapt them to React Query. `TemplatingPermissions` and
  `TemplateLifecycleStatus` are re-exported from the core, not from this package.
- **Template render execution** — actual rendering happens server-side; the preview
  hooks call the backend preview endpoints rather than evaluating templates in the
  browser.

## Caveats

- **Permission checks are a UX hint, not a security boundary.** Gate edit/publish
  controls with `@granit/react-authorization` against `TemplatingPermissions`, but
  the `Granit.Templating` backend re-checks authorization on every endpoint — never
  rely on client-side gating to protect a template body.
- **`status` is a numeric enum on the wire** (Int32, see `TemplateLifecycleStatus`);
  the list-surface filter param (`TemplateListParams.status`) and the `/meta`
  payload use the numeric form, while `currentStatus` on list items and the named
  `WorkflowLifecycleStatus` string union are surfaced for display.
- **Optimistic concurrency on draft updates.** `updateDraft` expects the current
  draft revision's `concurrencyStamp` in the `SaveTemplateRequest` body; a stale
  stamp yields a `409` (body-field stamp convention, never `If-Match`).
- **Treat preview output as untrusted.** Preview HTML is server-rendered template
  output; do not inject it through a DOM script sink (`.innerHTML`, etc.) without the
  Trusted-Types path — render it sandboxed (e.g. an `<iframe srcDoc>`). Safe display
  is owned by the rendering layer in `@granit/react-ui-templating`.

## License

Apache-2.0
