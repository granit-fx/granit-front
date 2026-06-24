# @granit/cms-redirects

Framework-agnostic **CMS redirects** SDK — the TypeScript counterpart of the
.NET `Granit.Cms.Redirects` module (wire contract under
`contracts/openapi/cms-redirects.json`). It exposes the redirect wire types, the
public anonymous **resolve** call (renderer-side), the admin **CRUD + grid +
settings** API, and the OpenAPI-derived validation constraints. It holds **no**
React, DOM or Node-only dependency.

A redirect maps a source path on a site to a target URL with an HTTP status
(`MovedPermanently` / `Found` / `TemporaryRedirect` / `PermanentRedirect`),
matched `Exact` or by `Prefix`. The public renderer resolves an incoming path to
its target; the admin surface manages the rules and per-site auto-redirect
settings. The React layer (provider + React Query hooks) lives in
[`@granit/react-cms-redirects`](../react-cms-redirects); the admin feature kit
(list page + form dialog + i18n bundles) lives in
[`@granit/react-ui-cms-redirects`](../react-ui-cms-redirects).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the centralized Axios client passed into every call.
- `@granit/query-engine` — `QueryRequest` / `PagedResult` contracts + `getPage`
  for the admin grid.
- `@granit/types` — `ISODateString` for timestamp fields.
- `@granit/validation` — `SchemaConstraints` shape backing `cmsRedirectsConstraints`.

## Quick start

```ts
import {
  resolveRedirect,
  listRedirects,
  createRedirect,
  getRedirectsGrid,
} from '@granit/cms-redirects';

// `basePath` is the API origin; calls append `/api/cms/redirects/...`.
const basePath = 'https://api.example.com';

// Public renderer — anonymous. Site is scoped by the `X-Granit-Site` header,
// not a query param. Returns null when nothing matches (backend 204).
const hit = await resolveRedirect(client, basePath, {
  siteId,
  path: '/old-page',
  culture: 'fr',
});
if (hit) {
  // hit.target + hit.statusCode → emit the redirect response
}

// Admin — flat list of a site's rules (requires Cms.Redirects.Read).
const rules = await listRedirects(client, basePath, siteId);

// Admin — create a rule (requires Cms.Redirects.Manage). Defaults applied
// server-side for the optional fields; 422 on a redirect loop / invalid path.
const { redirect, conflictWarning } = await createRedirect(client, basePath, siteId, {
  source: '/old',
  target: '/new',
  type: 'MovedPermanently',
});

// Admin grid — paginated / filterable / sortable, backed by QueryEngine.
const page = await getRedirectsGrid(client, basePath, queryRequest, { signal });
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `RedirectType` | type | `'MovedPermanently' \| 'Found' \| 'TemporaryRedirect' \| 'PermanentRedirect'` |
| `RedirectMatchType` | type | `'Exact' \| 'Prefix'` — how the source path is matched |
| `RedirectOrigin` | type | `'Manual' \| 'AutoFromPageMove' \| 'Imported'` |
| `RedirectResponse` | type | The stored redirect (id, source, target, status, hit counters) |
| `RedirectMutationResult` | type | Create/update result + soft `conflictWarning` page-path collision |
| `ResolveResponse` | type | Public resolve result (`target` + `statusCode`) |
| `RedirectPreviewResponse` | type | Admin preview of resolving a candidate path |
| `RedirectCreateRequest` | type | `POST .../redirects` body |
| `RedirectUpdateRequest` | type | `PUT .../redirects/{id}` body (source is immutable) |
| `SiteRedirectSettingsResponse` | type | Per-site settings (`autoRedirectOnMove`) |
| `SiteRedirectSettingsRequest` | type | Upsert body for per-site settings |
| `PagedResult` / `PaginationParams` / `QueryRequest` | type | Re-exported QueryEngine grid contracts |
| `resolveRedirect` | fn | `GET .../resolve` — public, anonymous, site via `X-Granit-Site` |
| `listRedirects` | fn | `GET .../sites/{siteId}/redirects` — flat list |
| `getRedirect` | fn | `GET .../{id}` |
| `createRedirect` | fn | `POST .../sites/{siteId}/redirects` (201) |
| `updateRedirect` | fn | `PUT .../{id}` — repoint target / status / match / active |
| `deleteRedirect` | fn | `DELETE .../{id}` — soft delete (204) |
| `previewRedirect` | fn | `GET .../sites/{siteId}/preview` — test a candidate path |
| `getRedirectsGrid` | fn | `GET .../grid` — `MapGranitQuery<Redirect>` admin grid |
| `getRedirectSettings` | fn | `GET .../sites/{siteId}/settings` |
| `updateRedirectSettings` | fn | `PUT .../sites/{siteId}/settings` — upsert |
| `cmsRedirectsConstraints` | const | OpenAPI-derived validation constraints (length / pattern / required) |

Every function takes the `@granit/api-client` `AxiosInstance` as its first
argument and a `basePath` origin as its second, so interceptors (CSRF, auth,
tenant) apply uniformly. `resolveRedirect` additionally accepts
`RequestFetchOptions` for SSR caching hints forwarded to the fetch adapter.

## Out of scope / caveats

- **Permissions are enforced server-side.** Reads require `Cms.Redirects.Read`,
  mutations require `Cms.Redirects.Manage`. The .NET backend is the only
  authoritative check; this SDK issues calls and surfaces the results.
- **Site scoping is header-driven for resolve.** `resolveRedirect` sends
  `X-Granit-Site`; the backend scopes via `ICurrentSite`, never a query
  parameter. Admin calls scope by an explicit `{siteId}` path segment.
- **`source` is immutable** on a redirect — `RedirectUpdateRequest` cannot
  change it; delete and recreate to repoint a source path.
- **Optionality follows the C#-default rule, not nullability.** `culture` /
  `lastHitAt` are required keys with nullable values (`T | null`); fields with a
  C# default (`type`, `matchType`, `isActive`, …) are genuinely optional (`?`).
- **`cmsRedirectsConstraints` is generated** from
  `contracts/openapi/cms-redirects.json` (DO NOT EDIT) and is consumed via
  `createConstraintsResolver` from `@granit/react-validation` for spec-driven
  form validation.
- **No React Query / query-key factory here** — those live in
  [`@granit/react-cms-redirects`](../react-cms-redirects). Use the raw functions
  from this package only outside React (renderer SSR, CLIs, tests).

## License

Apache-2.0
