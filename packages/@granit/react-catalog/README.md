# @granit/react-catalog

React bindings for [`@granit/catalog`](../catalog) — a `CatalogProvider` plus
React Query hooks for product CRUD, lifecycle transitions (publish / archive),
metadata replacement and external-provider mappings. The .NET counterpart is the
`Granit.Catalog` module (`Granit.Catalog.Endpoints`); the wire contract is
`contracts/openapi/catalog.json`.

This is the **React hooks + provider** layer of the catalog split. The
framework-agnostic core ([`@granit/catalog`](../catalog)) owns the DTOs, the
Axios calls and the OpenAPI-derived validation constraints; this package wraps
those calls in `@tanstack/react-query` hooks and threads the Axios client and
base path through context. The admin feature kit — list grid, forms, detail page
— lives in [`@granit/react-ui-catalog`](../react-ui-catalog). A product's
lifecycle is `Draft → Published → Archived` (it never enters `PendingReview`).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers:

- `@granit/catalog` — the core DTOs + Axios calls this package wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — exposes `<GranitClientProvider>` /
  `useOptionalGranitClient`, the fallback source for the Axios client.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).

Optional peers, only needed by the `testing` subpath and the admin grid:

- `@granit/query-engine` / `@granit/react-query-engine` — paged-result and
  query-metadata types for the products admin grid.
- `msw` (`^2`) — required only when importing `@granit/react-catalog/testing`.

## Quick start

Wire the provider once (it resolves the Axios client from `config.client` or the
nearest `<GranitClientProvider>`), then call the hooks anywhere below it.

```tsx
import { CatalogProvider, useActiveProducts, usePublishProduct } from '@granit/react-catalog';
import type { ProductId } from '@granit/catalog';

function App({ client }: { client: import('@granit/api-client').AxiosInstance }) {
  // basePath defaults to `/api/v1/catalog`; queryKeyPrefix defaults to ['catalog'].
  return (
    <CatalogProvider config={{ client }}>
      <ActiveProducts />
    </CatalogProvider>
  );
}

function ActiveProducts() {
  const { data, isLoading } = useActiveProducts(); // GET /catalog/products/active
  const publish = usePublishProduct(); // POST /catalog/products/{id}/publish → 204

  if (isLoading) return null;
  return (
    <ul>
      {data?.items.map((product) => (
        <li key={product.id}>
          {product.name}
          <button onClick={() => publish.mutate(product.id as ProductId)}>Publish</button>
        </li>
      ))}
    </ul>
  );
}
```

Every mutation invalidates the `['catalog', 'products', …]` query subtree on
success (and the affected detail key when an id is known), so dependent queries
refetch without manual cache wiring.

## Public API

| Symbol                            | Kind     | Purpose                                                        |
| --------------------------------- | -------- | -------------------------------------------------------------- |
| `CatalogProvider`                 | provider | Resolves the Axios client + base path, exposes via context     |
| `useCatalogConfig`                | hook     | Reads the `ResolvedCatalogConfig` of the nearest provider      |
| `buildCatalogQueryKey`            | fn       | Query-key factory (prefix + segments, default `catalog`)       |
| `CatalogConfig`                   | type     | Provider input: `client?`, `basePath`, `queryKeyPrefix?`       |
| `CatalogProviderProps`            | type     | Props for `CatalogProvider` (`basePath` optional)              |
| `ResolvedCatalogConfig`           | type     | `CatalogConfig` with `client` guaranteed non-null              |
| `useActiveProducts`               | hook     | `GET /products/active`, published catalog (`PagedResult`)      |
| `useProduct`                      | hook     | `GET /products/{id}`, any status; skipped when id is nullish   |
| `useProductBySku`                 | hook     | `GET /products/by-sku/{sku}`, any status; skipped when nullish |
| `useCreateProduct`                | hook     | `POST /products`, creates a Draft product                      |
| `useUpdateProduct`                | hook     | `PUT /products/{id}`, edits a Draft product                    |
| `useUpdateProductMetadata`        | hook     | `PUT /products/{id}/metadata`, replaces all metadata           |
| `usePublishProduct`               | hook     | `POST /products/{id}/publish`, Draft to Published (204)        |
| `useArchiveProduct`               | hook     | `POST /products/{id}/archive`, Published to Archived (204)     |
| `useAddProductExternalMapping`    | hook     | `POST /products/{id}/external-mappings`, returns the product   |
| `useRemoveProductExternalMapping` | hook     | `DELETE /products/{id}/external-mappings/{mappingId}` (204)    |
| `*Variables`                      | type     | Mutation-input shapes (`UpdateProductVariables`, ...)          |

DTOs (`ProductResponse`, `ProductId`, `ProductCreateRequest`, …) and the raw
Axios calls are re-exported from [`@granit/catalog`](../catalog), not from here.

### Testing subpath (`@granit/react-catalog/testing`)

| Symbol                  | Kind  | Purpose                                                          |
| ----------------------- | ----- | ---------------------------------------------------------------- |
| `mockProducts`          | const | `ProductResponse` fixtures (Published + Draft, Stripe/Avalara)   |
| `createCatalogHandlers` | fn    | Stateful MSW handlers for all catalog routes (in-memory store)   |
| `productQueryMetadata`  | const | `QueryMetadata` for the products admin grid (filters/sort/quick) |
| `resetCatalogMocks`     | fn    | Restore the in-memory store to the initial fixtures              |

The handlers mutate an in-memory store, so a mutation is reflected by subsequent
`GET`s; call `resetCatalogMocks()` between tests. Importing this subpath pulls in
`msw` and `@granit/react-query-engine/testing`.

## Caveats

- **Lifecycle guards live server-side.** `useUpdateProduct` targets Draft
  products only and `usePublishProduct` / `useArchiveProduct` enforce the
  `Draft → Published → Archived` transitions on the backend; the hooks surface
  the resulting error rather than blocking the call. Gate the UI with
  `lifecycleStatus`, but treat the server as the authority.
- **Metadata is not a PII store.** `UpdateProductMetadataRequest.metadata`
  replaces (not merges) the whole map and surfaces in audit logs and exports —
  never put PII in it.
- **204-resolving mutations.** `usePublishProduct`, `useArchiveProduct` and
  `useRemoveProductExternalMapping` resolve with `void` (backend returns 204);
  read the fresh state from the invalidated queries, not the mutation result.
  `useAddProductExternalMapping` is the exception — it returns the full updated
  `ProductResponse` (200).
- **Permission checks are not enforced here.** `CatalogPermissions` lives in
  [`@granit/catalog`](../catalog); client-side checks are a UX hint only — every
  endpoint re-checks authorization on the .NET backend.

## License

Apache-2.0
