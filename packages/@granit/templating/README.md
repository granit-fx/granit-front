# @granit/templating

Template-administration SDK — the framework-level TypeScript counterpart of the
.NET `Granit.Templating` module (contract: `contracts/openapi/templating.json`).

This is the framework-agnostic **core** layer: it exposes the DTOs, the Axios HTTP
functions and the permission constants needed to drive template authoring from any
client — React, React Native, a CLI, tests. It holds **no** React, DOM or Node-only
dependency. The React hooks/providers layer lives in
[`@granit/react-templating`](../react-templating); the admin feature kit (list /
create / edit pages, editor, preview, history diff, category dialog) lives in
[`@granit/react-ui-templating`](../react-ui-templating).

A template is keyed by `name` (plus an optional `culture`) and moves through a
workflow lifecycle — `Draft → PendingReview → Published → Archived`. Each template
carries at most one draft revision and one published revision; saving overwrites the
draft, publishing promotes it, and history exposes the full revision trail. Preview
renders the current content against caller-supplied data, returning HTML or a binary
blob. Categories are a flat, sortable taxonomy over templates.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
to a public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) and `buildApiUrl`, passed into / used by every call.
- `@granit/query-engine` — `PagedResult` / `PaginationParams` for the list and
  history surfaces.
- `@granit/types` — branded `EntityId` and `ISODateString` for the DTOs.

## Quick start

```ts
import {
  getTemplates,
  getTemplate,
  saveDraft,
  publishTemplate,
  previewTemplate,
  TemplateLifecycleStatus,
  TemplatingPermissions,
} from '@granit/templating';

// `basePath` is the templating module's collection root.
const basePath = '/api/v1/templating';

// 1. List — paginated + filterable; `currentStatus` is the numeric QE projection.
const page = await getTemplates(client, basePath, {
  search: 'invoice',
  status: TemplateLifecycleStatus.Published,
});

// 2. Read a single template by name (optionally per culture).
const detail = await getTemplate(client, basePath, 'invoice', 'fr-BE');

// 3. Save the draft, then promote it. `concurrencyStamp` guards the draft revision.
await saveDraft(client, basePath, {
  content: detail.draft?.content ?? '<h1>{{ Customer.Name }}</h1>',
  name: 'invoice',
  culture: 'fr-BE',
  concurrencyStamp: detail.draft?.concurrencyStamp ?? null,
});
await publishTemplate(client, basePath, 'invoice', 'fr-BE');

// 4. Preview the rendered output against sample data.
const { html, renderTimeMs } = await previewTemplate(client, basePath, 'invoice', {
  culture: 'fr-BE',
  data: { Customer: { Name: 'Acme NV' } },
});

// Permission strings for client-side UX gating (see Caveats).
TemplatingPermissions.Templates.Manage; // 'Templating.Templates.Manage'
```

For a binary artefact (PDF, image, …) use `previewTemplateBinary`, which requests
`responseType: 'blob'` and resolves to a `Blob`.

## Public API

| Symbol                         | Kind  | Purpose                                                            |
| ------------------------------ | ----- | ------------------------------------------------------------------ |
| `TemplateLifecycleStatus`      | const | Numeric status map for the QE list projection (`Draft`=0 …)        |
| `TemplatingPermissions`        | const | Permission strings (`Templates`/`Categories` × `Read`/`Manage`)    |
| `getTemplates`                 | fn    | `GET {basePath}/templates` — paged, filterable `TemplateListItem`  |
| `getTemplate`                  | fn    | `GET .../templates/{name}` — draft + published revisions           |
| `saveDraft`                    | fn    | `POST .../templates` — create/overwrite the draft revision         |
| `updateDraft`                  | fn    | `PUT .../templates/{name}` — update an existing draft              |
| `deleteDraft`                  | fn    | `DELETE .../templates/{name}/draft`                                |
| `publishTemplate`              | fn    | `POST .../templates/{name}/publish` — promote draft → published    |
| `unpublishTemplate`            | fn    | `POST .../templates/{name}/unpublish`                              |
| `getLifecycleInfo`             | fn    | `GET .../templates/{name}/lifecycle` — status + transitions        |
| `getHistory`                   | fn    | `GET .../templates/{name}/history` — paged revision summaries      |
| `getRevision`                  | fn    | `GET .../templates/{name}/history/{revisionId}` — full revision    |
| `previewTemplate`              | fn    | `POST .../templates/{name}/preview` — rendered HTML + timing       |
| `previewTemplateBinary`        | fn    | Same route, `responseType: 'blob'` → `Blob` (PDF/image/…)          |
| `getVariables`                 | fn    | `GET .../templates/{name}/variables` — global/model/enriched       |
| `getLayouts`                   | fn    | `GET {basePath}/layouts` — available layout names                  |
| `getCategories`                | fn    | `GET {basePath}/categories`                                        |
| `createCategory`               | fn    | `POST {basePath}/categories`                                       |
| `updateCategory`               | fn    | `PUT {basePath}/categories/{id}`                                   |
| `deleteCategory`               | fn    | `DELETE {basePath}/categories/{id}`                                |
| `TemplateDetail`               | type  | A template with its `draft` / `published` revisions                |
| `TemplateRevision`             | type  | Full revision (content, mimeType, status, concurrency stamp)       |
| `TemplateRevisionSummary`      | type  | History row — metadata + `contentLength`, no content body          |
| `TemplateListItem`             | type  | List row; `currentStatus` is the numeric QE projection             |
| `TemplateListParams`           | type  | `PaginationParams` + `search`/`status`/`categoryId`/`culture`      |
| `TemplateLifecycle`            | type  | Current status, `workflowEnabled`, `availableTransitions`          |
| `TemplateHistory`              | type  | Paginated `TemplateRevisionSummary[]` envelope                     |
| `TemplateVariables`            | type  | `global` / `model` / `enriched` `TemplateVariable[]` buckets       |
| `TemplateCategory`             | type  | Category node (`sortOrder`, `templateCount`, branded id)           |
| `SaveTemplateRequest`          | type  | Draft save body (`content` + optional name/culture/stamp)          |
| `SaveTemplateCategoryRequest`  | type  | Category create/update body                                        |
| `TemplatePreviewRequest`       | type  | `{ culture?, data? }` — `data` is arbitrary JSON                   |
| `TemplatePreviewResponse`      | type  | `{ html, revisionId, renderTimeMs }`                               |
| `TemplateParseError`           | type  | Frontend-only parse-error model (not a backend DTO)                |
| `TemplateKey`                  | type  | `{ name, culture? }` template identity                             |
| `TemplateCategoryId`           | type  | Branded `EntityId<'TemplateCategory'>`                             |
| `TemplateRevisionId`           | type  | Branded `EntityId<'TemplateRevision'>`                             |
| `TemplatingConfig`             | type  | `{ client, basePath, queryKeyPrefix }` shared with the React layer |
| `WorkflowLifecycleStatus`      | type  | String union `'Draft' \| … \| 'Archived'` (detail/lifecycle)       |
| `TemplateLifecycleStatusValue` | type  | Numeric value union of `TemplateLifecycleStatus`                   |

`TemplateVariable` is also re-exported for typing individual variable rows.

## Caveats

- **Two status representations, by design.** Detail / lifecycle / revision
  endpoints serialize the status as the string `WorkflowLifecycleStatus`; the
  query-engine list endpoint projects it as the numeric `TemplateLifecycleStatus`
  (`TemplateListItem.currentStatus` and the `TemplateListParams.status` filter).
  Compare list rows against the numeric const, detail rows against the string union
  — they are not interchangeable.
- **Optimistic concurrency, never `If-Match`.** Pass the draft revision's
  `concurrencyStamp` in the `SaveTemplateRequest` body when updating an existing
  draft; a stale stamp yields a `409` from the backend (read-modify-write: re-fetch
  the detail before retrying).
- **Permission strings are UX hints, not enforcement.** `TemplatingPermissions`
  exists to gate controls client-side; every endpoint re-checks authorization on the
  .NET backend. `Templates.Read` covers list/detail/history/variables/lifecycle,
  `Templates.Manage` covers save/delete/publish/unpublish; categories split the same
  way.
- **Preview renders untrusted template content.** `previewTemplate` returns raw
  `html`; the caller is responsible for safe injection (Trusted Types / sanitized
  sink) — the rendering layer in [`@granit/react-ui-templating`](../react-ui-templating)
  owns that boundary, not this package.

## Out of scope

- **React hooks / query-key factories** — TanStack Query wrappers and the
  `TemplatingProvider` live in [`@granit/react-templating`](../react-templating).
  `TemplatingConfig` is defined here only so both layers share one config shape.
- **Rendering** — editor, preview pane, revision diff, status badge, category dialog
  and the list/create/edit pages live in
  [`@granit/react-ui-templating`](../react-ui-templating).
- **The templating engine itself** — parsing and rendering happen server-side in
  `Granit.Templating`; this package only mirrors its HTTP surface.

## License

Apache-2.0
