# @granit/catalog

Product-catalog **types and HTTP client** — the framework-level TypeScript
counterpart of the .NET `Granit.Catalog` module (`Granit.Catalog.Endpoints`,
contract: `contracts/openapi/catalog.json`).

It exposes the DTOs, the products HTTP client, the permission constants and the
spec-derived validation constraints needed to drive the catalog from any client
— React, React Native, a CLI, tests. It holds **no** React, DOM or Node-only
dependency. The React hooks/provider layer lives in
[`@granit/react-catalog`](../react-catalog); the admin feature kit (products
grid, create/edit forms, detail page) lives in
[`@granit/react-ui-catalog`](../react-ui-catalog).

A catalog product is a SKU-keyed entry (`sku`, `name`, `type`, `unit`,
free-form string-to-string `metadata` map, external provider mappings) governed by a
`Draft → Published → Archived` lifecycle. Products are created in `Draft`,
edited while `Draft`, then transitioned with `publishProduct` / `archiveProduct`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the centralized Axios instance (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/query-engine` — `PagedResult` envelope returned by
  `listActiveProducts`.
- `@granit/types` — `EntityId` branding for `ProductId` /
  `ProductExternalMappingId`.
- `@granit/validation` — `SchemaConstraints` shape of `catalogConstraints`.

## Quick start

```ts
import {
  listActiveProducts,
  createProduct,
  publishProduct,
  CatalogPermissions,
} from '@granit/catalog';

// `basePath` is the catalog module root — calls append `/products...` to it.
const basePath = '/api/v1/catalog';

// 1. Published catalog only — `{ items, totalCount }` envelope (PagedResult).
const { items } = await listActiveProducts(client, basePath);

// 2. Create (always lands in Draft), then transition to Published.
const product = await createProduct(client, basePath, {
  sku: 'SUP-001',
  name: 'Premium support',
  type: 'Service',
  unit: 'hour',
});
await publishProduct(client, basePath, product.id); // 204 No Content

// Gate the call site on the write permission (UX hint, server still enforces).
const canManage = CatalogPermissions.Products.Manage; // 'Catalog.Products.Manage'
```

For React Query hooks and a wired `CatalogProvider`, use
[`@granit/react-catalog`](../react-catalog) instead of calling these functions
directly.

## Public API

| Symbol                            | Kind  | Purpose                                                        |
| --------------------------------- | ----- | -------------------------------------------------------------- |
| `ProductId`                       | type  | Branded `EntityId<'Product'>`                                  |
| `ProductExternalMappingId`        | type  | Branded `EntityId<'ProductExternalMapping'>`                   |
| `ProductLifecycleStatus`          | type  | `'Draft' \| 'Published' \| 'Archived'`                         |
| `ProductType`                     | type  | `'Service' \| 'Metered' \| 'Physical' \| 'Digital'`            |
| `ProductResponse`                 | type  | Catalog product entry (SKU, type, lifecycle, metadata, ...)    |
| `ProductExternalMappingResponse`  | type  | One external provider mapping (`providerName`, `externalId`)   |
| `ProductCreateRequest`            | type  | `POST .../products` body (creates in Draft)                    |
| `ProductUpdateRequest`            | type  | `PUT .../products/{id}` body (Draft only)                      |
| `UpdateProductMetadataRequest`    | type  | `PUT .../products/{id}/metadata` body (replace-all)            |
| `AddProductExternalMappingRequest`| type  | `POST .../products/{id}/external-mappings` body                |
| `listActiveProducts`              | fn    | `GET .../products/active` — Published only, `PagedResult`      |
| `getProductById`                  | fn    | `GET .../products/{id}` — any lifecycle status                 |
| `getProductBySku`                 | fn    | `GET .../products/by-sku/{sku}` — reverse lookup for syncs     |
| `createProduct`                   | fn    | `POST .../products` — returns the new Draft product            |
| `updateProduct`                   | fn    | `PUT .../products/{id}` — edit a Draft product                 |
| `updateProductMetadata`           | fn    | `PUT .../products/{id}/metadata` — replace all metadata        |
| `publishProduct`                  | fn    | `POST .../products/{id}/publish` — Draft → Published (204)     |
| `archiveProduct`                  | fn    | `POST .../products/{id}/archive` — Published → Archived (204)  |
| `addProductExternalMapping`       | fn    | `POST .../products/{id}/external-mappings` — returns product   |
| `removeProductExternalMapping`    | fn    | `DELETE .../products/{id}/external-mappings/{mappingId}` (204) |
| `CatalogPermissions`              | const | `Products.Read` / `Products.Manage` permission strings         |
| `catalogConstraints`              | const | Spec-derived field constraints (`createConstraintsResolver`)   |

## Out of scope / caveats

- **No admin query grid here.** The bare `GET {basePath}/products` route is the
  full-lifecycle, `Products.Manage`-gated query-engine grid — consume it via
  [`@granit/react-query-engine`](../react-query-engine), not this package.
  `listActiveProducts` only covers the Published subset.
- **Metadata MUST NOT contain PII.** Product `metadata` (and the
  `UpdateProductMetadataRequest` body) is surfaced verbatim in audit logs and
  exports. Treat it as free-form configuration, never personal data.
- **Lifecycle is enforced server-side.** `ProductLifecycleStatus` mirrors the
  reachable subset of `Granit.Workflow.WorkflowLifecycleStatus` for `Product`
  (`Draft → Published → Archived`; `PendingReview` is never entered). The client
  helpers do not validate the current state — an out-of-order transition is
  rejected by the backend, not here.
- **`catalogConstraints` is generated.** It is derived from
  `contracts/openapi/catalog.json` by `scripts/generate-front-constraints.mjs`
  and regenerated on pre-commit — never hand-edit it. It feeds
  `createConstraintsResolver` from `@granit/react-validation` for form
  validation; the spec is the single source of truth.
- **`CatalogPermissions` are UX hints, not a boundary.** Use them to hide or
  skip actions the user cannot perform; the `Granit.Catalog` backend re-checks
  every request.
