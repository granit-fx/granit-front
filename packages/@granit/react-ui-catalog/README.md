# @granit/react-ui-catalog

Admin UI feature kit for the Granit **Catalog** module — the products list
(smart-filtered query grid), the spec-validated create/edit product forms, and
the product detail page (lifecycle transitions, key/value metadata editor,
external-provider mappings). This is the **react-ui admin layer**: it composes
the headless [`@granit/react-catalog`](../react-catalog) data hooks with the
foundation UI packages (`@granit/react-ui`, `@granit/react-ui-admin-kit`) into
mountable pages and sub-components. It renders; it owns no HTTP transport and no
TanStack Query wiring of its own.

The split is three packages over the same .NET `Granit.Catalog` backend
(contract: `contracts/openapi/catalog.json`):

- [`@granit/catalog`](../catalog) — framework-agnostic core: DTOs, Axios calls,
  and the OpenAPI-derived `catalogConstraints` (validation source of truth).
- [`@granit/react-catalog`](../react-catalog) — React hooks + `CatalogProvider`:
  `useProduct`, `useCreateProduct`, `useUpdateProduct`, lifecycle / mapping /
  metadata mutations.
- `@granit/react-ui-catalog` (this package) — admin pages, sub-components, and
  the `Catalog.*` i18n bundles.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/catalog` — `catalogConstraints` (form validation) + `Product*` DTO
  and id types.
- `@granit/react-catalog` — the headless `CatalogProvider` + data hooks the
  pages call.
- `@granit/react-query-engine` — `QueryProvider` + smart-filter hooks for the
  list grid.
- `@granit/query-engine` — `QueryConfig` for the grid's base path.
- `@granit/react-ui` — shadcn-based primitives (`Button`, `Form`, `Card`,
  `AlertDialog`, `toast`, …).
- `@granit/react-ui-admin-kit` — `QueryDataTable`, `SmartFilterBar`,
  `SortSelector`, operator labels.
- `@granit/react-validation` — `createConstraintsResolver` (spec-driven RHF
  resolver).
- `@granit/react-workflow` + `@granit/workflow` — `buildLifecycleTransitionPrompt`
  and `WorkflowLifecycleStatus` for the publish/archive confirmations.
- `@granit/react-localization` — `useTranslation` (host i18next instance).
- `@granit/types` — `toEntityId` for the route-param → branded id cast.
- `@tanstack/react-table` (`^8.21`) — column model for the grid.
- `react` / `react-dom` (`^19`), `react-hook-form` (`^7.80`),
  `react-router` (`^7.18`), `lucide-react` (`^1.21`).

## Quick start

The host app mounts `CatalogProvider` (which resolves an Axios client via
`GranitClientProvider`); the pages here only call its hooks. Wire the four pages
into your router and register the i18n bundles once at startup.

```tsx
import { CatalogProvider } from '@granit/react-catalog';
import {
  CatalogListPage,
  CatalogCreatePage,
  CatalogEditPage,
  CatalogDetailPage,
  catalogTranslationsEn,
  catalogTranslationsFr,
} from '@granit/react-ui-catalog';
import { Route, Routes } from 'react-router';
import i18n from './i18n';

// Owns the Catalog.* feature keys; the host root supplies Common.* / Operators.*.
i18n.addResourceBundle('en', 'translation', catalogTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', catalogTranslationsFr, true, true);

export function CatalogRoutes() {
  return (
    <CatalogProvider config={{ client, basePath: '/api/v1/catalog' }}>
      <Routes>
        <Route path="/catalog" element={<CatalogListPage />} />
        <Route path="/catalog/new" element={<CatalogCreatePage />} />
        <Route path="/catalog/:id" element={<CatalogDetailPage />} />
        <Route path="/catalog/:id/edit" element={<CatalogEditPage />} />
      </Routes>
    </CatalogProvider>
  );
}
```

`CatalogListPage` wires its own `QueryProvider` from the internal `QUERY_CONFIG`
(`GET /api/v1/catalog/products`); the other pages read the route `:id` param,
cast it with `toEntityId<'Product'>`, and drive `useProduct` /
`useCreateProduct` / `useUpdateProduct`. The detail page composes the sub-exports
directly, which you can also reuse in a custom layout:

```tsx
import {
  LifecycleStatusBadge,
  LifecycleActions,
  MetadataEditor,
  ExternalMappingsManager,
} from '@granit/react-ui-catalog';
import { useProduct } from '@granit/react-catalog';

function ProductHeader({ product }: { product: ProductResponse }) {
  return (
    <>
      <LifecycleStatusBadge status={product.lifecycleStatus} />
      <LifecycleActions product={product} /> {/* Draft→Publish, Published→Archive */}
      <MetadataEditor product={product} />
      <ExternalMappingsManager product={product} />
    </>
  );
}
```

## Public API

| Symbol                    | Kind      | Purpose                                                             |
| ------------------------- | --------- | ------------------------------------------------------------------- |
| `CatalogListPage`         | component | Smart-filtered, sortable, server-paginated products grid (provider) |
| `CatalogCreatePage`       | component | Spec-validated create form (`ProductCreateRequest` constraints)     |
| `CatalogEditPage`         | component | Edit form, gated to `Draft` (`ProductUpdateRequest` constraints)    |
| `CatalogDetailPage`       | component | Product info + lifecycle, metadata, and external-mappings sections  |
| `LifecycleActions`        | component | Publish/Archive buttons + confirm dialog (strong-confirm)           |
| `LifecycleStatusBadge`    | component | Localized badge for `Draft` / `Published` / `Archived`              |
| `MetadataEditor`          | component | Key/value metadata grid editor → `useUpdateProductMetadata`         |
| `ExternalMappingsManager` | component | Add/remove provider/external-id mappings (spec-validated add form)  |
| `createProductColumns`    | fn        | `ColumnDef<ProductResponse>[]` for the grid (SKU opens detail)      |
| `catalogTranslationsEn`   | const     | English `Catalog.*` flat-key i18next bundle                         |
| `catalogTranslationsFr`   | const     | French `Catalog.*` flat-key i18next bundle                          |
| `CatalogTranslations`     | type      | Shape of a `Catalog.*` bundle (keyed off the English source)        |

The headless data layer (`CatalogProvider`, `useProduct`, the mutations) and the
`Product*` DTO / id / enum types are **not** re-exported here — import them from
[`@granit/react-catalog`](../react-catalog) and [`@granit/catalog`](../catalog).

## Validation

The forms carry no hand-written schema. Each `useForm` resolver comes from
`createConstraintsResolver(catalogConstraints.<Request>, t, …)`
(`@granit/react-validation` + `@granit/catalog`), so `required` and `maxLength`
rules track the OpenAPI contract:

- `CatalogCreatePage` → `catalogConstraints.ProductCreateRequest`
- `CatalogEditPage` → `catalogConstraints.ProductUpdateRequest`
- `ExternalMappingsManager` → `catalogConstraints.AddProductExternalMappingRequest`

The resolver validates only registered fields, so request-only shapes are never
evaluated client-side; the backend remains authoritative.

## i18n

Bundles ship **flat** `Catalog.*` keys in the `translation` namespace (the host
looks them up with `keySeparator` / `nsSeparator` disabled — they are exact
string keys, not namespace traversals). Register them merged-deep:

```ts
i18n.addResourceBundle('en', 'translation', catalogTranslationsEn, true, true);
```

This package owns the `Catalog.*` keys only; the shared `Common.*` /
`Operators.*` keys belong to the host application root. The lifecycle dialog
titles, descriptions, and confirm labels are resolved from the **`workflow`**
namespace via `buildLifecycleTransitionPrompt`, so the host must also register
`@granit/react-workflow`'s bundle.

## Out of scope / caveats

- **Headless data layer** — `CatalogProvider`, `useProduct`, and every Catalog
  mutation live in [`@granit/react-catalog`](../react-catalog); this package
  consumes them and renders. It defines no query keys and issues no HTTP itself.
- **DTOs, id types, and constraints** — owned by
  [`@granit/catalog`](../catalog) (mirror of `Granit.Catalog`). Import
  `ProductResponse`, `ProductId`, `ProductType`, and `catalogConstraints` from
  there.
- **Edit is Draft-only.** `CatalogEditPage` renders a destructive `Alert` and
  refuses to submit when `lifecycleStatus !== 'Draft'`; the detail page hides
  its Edit button accordingly. This mirrors the backend lifecycle (a published
  product is immutable except via lifecycle transitions). It is a UX guard, not
  an authorization boundary — the server enforces the transition rules.
- **Strong-confirm on archive.** The `Published → Archived` transition requires
  the operator to retype the product name before the confirm button enables
  (driven by `prompt.requiresStrongConfirm` from the workflow metadata).
  `Archived` is terminal — `LifecycleActions` renders nothing for it.
- **No permission gating built in.** Mount the pages behind your app's route
  guards; this kit does not check permissions before rendering create/edit
  controls.

## License

Apache-2.0
