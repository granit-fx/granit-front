# @granit/entities-views

Framework-agnostic **saved-views** SDK — the TypeScript counterpart of the .NET
`Granit.Entities.Views` module. It exposes the wire DTOs and the Axios HTTP client
for the `EntityView` aggregate, so any consumer (React renderer, mobile app, CLI,
tests) can drive the `/entities/{entityName}/views` surface with full type safety.

A saved view is how a user carves a list down to "their slice": their open deals,
their team's overdue invoices, the tenant-wide default kanban. A view stores a JSON
**delta** (`state`) over a compiled base collection identified by `basedOn`, carries a
**visibility** level (Personal / Shared / Tenant) plus the pin / tenant-default /
personal-default flags, and is treated as opaque by this layer — the renderer applies
`state` to the underlying `QueryRequest`. This package holds **no** React, DOM or
Node-only dependency; it sits deliberately apart from [`@granit/entities`](../entities)
so a renderer can consume the entity manifest without pulling in the views CRUD surface.
The React Query hooks and tab-strip UX live in
[`@granit/react-entities-views`](../react-entities-views).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
`@granit/api-client` as a peer (it provides the configured `AxiosInstance` carrying the
CSRF, auth and tenant interceptors).

## Quick start

```ts
import {
  listEntityViews,
  createEntityView,
  shareEntityView,
  setEntityViewPersonalDefault,
  type EntityViewCreateBodyRequest,
} from '@granit/entities-views';

// `basePath` is the entities API root; `entityName` selects the aggregate,
// so the same calls work for parties, products, invoices, …
const basePath = '/api/v1/entities';
const entityName = 'parties';

// 1. List every view the caller can access for this entity.
const views = await listEntityViews(client, basePath, entityName);

// 2. Save the current grid state as a new Personal view (delta over `basedOn`).
const draft: EntityViewCreateBodyRequest = {
  basedOn: 'all-parties',
  kind: 'list',
  name: 'My open leads',
  state: { filters: [{ field: 'status', op: 'eq', value: 'open' }] },
  description: null,
  icon: null,
};
const created = await createEntityView(client, basePath, entityName, draft);

// 3. Make it the caller's landing view, then promote it to the team.
await setEntityViewPersonalDefault(client, basePath, entityName, created.id, true);
await shareEntityView(client, basePath, entityName, created.id, {
  roles: ['sales'],
  users: [],
});
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `EntityViewResponse` | type | Wire projection of an `EntityView` (delta `state`, flags, audience) |
| `EntityViewVisibility` | type | `'Personal' \| 'Shared' \| 'Tenant'` |
| `EntityViewSharedWith` | type | `Shared`-view audience (`roles` + `users`); `null` otherwise |
| `EntityViewCreateBodyRequest` | type | `POST .../views` body (`basedOn`, `kind`, `name`, `state`, …) |
| `EntityViewUpdateBodyRequest` | type | `PUT .../views/{id}` body (editable fields only) |
| `EntityViewShareBodyRequest` | type | `POST .../views/{id}/share` body (`roles` + `users`) |
| `EntityViewToggleFlagRequest` | type | `{ value: boolean }` for the pin / star / set-default toggles |
| `listEntityViews` | fn | `GET {basePath}/{entityName}/views` |
| `getEntityView` | fn | `GET {basePath}/{entityName}/views/{id}` |
| `getDefaultEntityView` | fn | `GET .../views/_default` — `null` on 204 (fall back to compiled) |
| `createEntityView` | fn | `POST {basePath}/{entityName}/views` |
| `updateEntityView` | fn | `PUT {basePath}/{entityName}/views/{id}` |
| `deleteEntityView` | fn | `DELETE {basePath}/{entityName}/views/{id}` |
| `setEntityViewPinned` | fn | `POST .../views/{id}/pin` — pin / unpin as a workspace tab |
| `setEntityViewTenantDefault` | fn | `POST .../views/{id}/set-default` — tenant default flag |
| `setEntityViewPersonalDefault` | fn | `POST .../views/{id}/star` — per-user landing view |
| `shareEntityView` | fn | `POST .../views/{id}/share` — promote / re-audience a Shared view |

All functions take the configured `AxiosInstance` first, then `basePath` and
`entityName`; the read calls accept an optional trailing `AxiosRequestConfig`.

## Out of scope / caveats

- **Delta semantics are opaque here.** `state` is a `Readonly<Record<string, unknown>>`
  JSONB payload; this package never parses, composes or applies it. The renderer maps it
  onto the base collection's `QueryRequest`. `basedOn` and `kind` are immutable
  post-creation, so the update body omits them.
- **Visibility is server-enforced.** `Personal` views are owner-only; promoting to
  `Shared` (`Entities.Views.Share`) or `Tenant` / setting the tenant default
  (`Entities.Views.Manage`) is gated on the .NET backend. The client flags are a UX
  hint, not an authorization boundary — every call is re-checked server-side.
- **Default precedence lives backend-side.** `getDefaultEntityView` resolves the
  effective default per ADR-047 §4 and returns `null` on `204 No Content`; the consumer
  must then fall back to the compiled default rather than inventing one.
- **No React, query keys or hooks here.** React Query wiring, the dirty-state UX and the
  view tab strip belong to [`@granit/react-entities-views`](../react-entities-views).
- **Backend contract.** Routes and field names mirror `Granit.Entities.Views` and are
  pinned by `contracts/openapi/entities-views.json` (camelCase JSON, PascalCase
  string-literal enums, `readonly` arrays / records, matching `@granit/entities`).

## License

Apache-2.0
