# @granit/react-cms-redirects

React Query hooks + provider for the Granit **CMS redirects** module — listing,
detail, admin grid, per-site settings, redirect preview, and create/update/delete
mutations. This is the **React hooks layer**: it wraps the framework-agnostic Axios
calls and DTOs from [`@granit/cms-redirects`](../cms-redirects) in TanStack Query
hooks behind a shared `CmsRedirectsProvider` for client / base-path / query-key
configuration. It holds no rendering — list pages, form dialogs, and i18n bundles
live one layer up.

The split is three packages over the same .NET `Granit.Cms.Redirects` backend
(contract: `contracts/openapi/cms-redirects.json`):

- [`@granit/cms-redirects`](../cms-redirects) — framework-agnostic core: redirect
  wire types, the public anonymous `resolveRedirect` call, the admin CRUD + grid +
  settings Axios functions, and OpenAPI-derived validation constraints.
- `@granit/react-cms-redirects` (this package) — React Query hooks + provider.
- [`@granit/react-ui-cms-redirects`](../react-ui-cms-redirects) — admin UI kit: the
  redirect list page, create/edit form dialog, and locale bundles.

A redirect maps a source path on a site to a target URL with an HTTP status
(`MovedPermanently` / `Found` / `TemporaryRedirect` / `PermanentRedirect`), matched
`Exact` or by `Prefix`. The public renderer resolve call lives in the core package;
this layer is the admin surface only.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. A consumer must declare these peers:

- `@granit/cms-redirects` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/types` — shared base types (e.g. `ISODateString`).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-cms-redirects/testing`
  subpath.

The QueryEngine grid contracts (`QueryRequest`, `PagedResult`, `PaginationParams`)
are re-exported transitively through `@granit/cms-redirects`.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { CmsRedirectsProvider, useRedirects } from '@granit/react-cms-redirects';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <CmsRedirectsProvider
      config={{ client: useGranitClient(), basePath: '/api/cms/redirects' }}
    >
      {children}
    </CmsRedirectsProvider>
  );
}

function RedirectList({ siteId }: { siteId: string }) {
  const { data: redirects, isLoading } = useRedirects(siteId);
  if (isLoading || !redirects) return null;

  return (
    <ul>
      {redirects.map((r) => (
        <li key={r.id}>
          {r.source} → {r.target} ({r.statusCode})
        </li>
      ))}
    </ul>
  );
}
```

Admin screens combine the query hooks with the mutation hooks. Mutations key off
`siteId` so the cache invalidation can refresh the per-site list and the grid:

```tsx
import {
  useCreateRedirect,
  useDeleteRedirect,
  useRedirectsGrid,
} from '@granit/react-cms-redirects';
import type { QueryRequest } from '@granit/react-cms-redirects';

function RedirectGrid({ siteId, query }: { siteId: string; query: QueryRequest }) {
  const { data } = useRedirectsGrid(query);
  const { mutate: create } = useCreateRedirect();
  const { mutate: remove } = useDeleteRedirect();

  function add() {
    // `conflictWarning` on the result is a soft page-path collision notice.
    create({ siteId, request: { source: '/old', target: '/new' } });
  }

  return (
    <>
      <button type="button" onClick={add}>Add</button>
      {data?.items.map((r) => (
        <button key={r.id} type="button" onClick={() => remove({ id: r.id, siteId })}>
          Delete {r.source}
        </button>
      ))}
    </>
  );
}
```

`useRedirects`, `useRedirect`, `useRedirectSettings`, and `useRedirectPreview` are
guarded — they stay disabled until their `siteId` / `id` / `path` is non-empty, so
they are safe to mount before a site is selected. Pass `{ enabled: false }` to defer
further. `useRedirectsGrid` forwards the React Query `signal` for request
cancellation on QueryEngine fetches.

## Public API

| Symbol                       | Kind     | Purpose                                                           |
| ---------------------------- | -------- | ----------------------------------------------------------------- |
| `CmsRedirectsProvider`       | provider | Supplies client, base path, query-key prefix to all hooks below   |
| `useCmsRedirectsConfig`      | hook     | Read the resolved config; throws outside a provider               |
| `useRedirects`               | hook     | `GET .../sites/{siteId}/redirects` - flat per-site list           |
| `useRedirect`                | hook     | `GET .../{id}` - a single redirect by id                          |
| `useRedirectsGrid`           | hook     | `GET .../grid` - paginated/filterable QueryEngine admin grid      |
| `useRedirectSettings`        | hook     | `GET .../sites/{siteId}/settings` - per-site settings (defaulted) |
| `useRedirectPreview`         | hook     | `GET .../sites/{siteId}/preview` - resolve a candidate path       |
| `useCreateRedirect`          | hook     | `POST .../sites/{siteId}/redirects` mutation (+ cache seed)       |
| `useUpdateRedirect`          | hook     | `PUT .../{id}` mutation (target/type/matchType/active)            |
| `useDeleteRedirect`          | hook     | `DELETE .../{id}` mutation (+ cache eviction)                     |
| `useUpdateRedirectSettings`  | hook     | `PUT .../sites/{siteId}/settings` mutation                        |
| `cmsRedirectsKeys`           | const    | Query-key factory honoring the configured `queryKeyPrefix`        |
| `CmsRedirectsConfig`         | type     | Provider input (optional client / basePath / queryKeyPrefix)      |
| `ResolvedCmsRedirectsConfig` | type     | Provider output with the resolved required client + basePath      |
| `CmsRedirectsProviderProps`  | type     | `{ config, children }`                                            |

The barrel also re-exports the core wire contracts from
[`@granit/cms-redirects`](../cms-redirects) for convenience — the `Redirect*`
request/response DTOs (`RedirectResponse`, `RedirectCreateRequest`,
`RedirectUpdateRequest`, `RedirectMutationResult`, `RedirectPreviewResponse`,
`ResolveResponse`, `SiteRedirectSettings*`), the domain enums (`RedirectType`,
`RedirectMatchType`, `RedirectOrigin`), and the QueryEngine grid types
(`QueryRequest`, `PagedResult`, `PaginationParams`).

`./testing` subpath (requires the optional `msw` peer): `createCmsRedirectsHandlers`
(stateful MSW handlers, default base `/api/cms/redirects`) plus the `mockRedirects`
fixtures and the `CORPORATE_SITE_ID` constant.

## Caveats

- **Base path defaults to `''`.** `DEFAULT_BASE_PATH` is empty, so unless you pass
  `config.basePath`, calls resolve relative to the Axios client's `baseURL`. The MSW
  test handlers and the admin endpoints live under `/api/cms/redirects` — set that
  base path (or align the client) for the hooks to hit the right routes.
- **Source path is immutable.** `useUpdateRedirect` repoints target / status /
  match type and toggles active, but cannot change `source` — delete and recreate to
  move a source path (mirrors `RedirectUpdateRequest`).
- **`conflictWarning` is a soft notice, not an error.** A successful create/update
  may return a non-`null` `conflictWarning` (a page-path collision hint); surface it,
  but the mutation still succeeded. A hard duplicate-source create is a `409`.
- **No optimistic updates.** Mutations write the server response into the cache and
  invalidate the per-site list and every grid query; they do not optimistically
  mutate before the round-trip.

## Out of scope

- **Rendering** — the redirect list page, form dialog, and locale bundles live in
  [`@granit/react-ui-cms-redirects`](../react-ui-cms-redirects). This package is
  headless.
- **DTOs, HTTP transport, and validation constraints** — owned by
  [`@granit/cms-redirects`](../cms-redirects) (mirror of `Granit.Cms.Redirects`);
  hooks here only adapt them to React Query.
- **The public resolve call** — `resolveRedirect` (the anonymous renderer-side
  endpoint) is a core concern in [`@granit/cms-redirects`](../cms-redirects), not a
  hook here. This layer is the authenticated admin surface only.

## License

Apache-2.0
