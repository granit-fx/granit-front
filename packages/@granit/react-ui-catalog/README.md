# @granit/react-ui-catalog

Admin UI for the **Catalog** module — the products list (smart-filtered query
grid), the create/edit product forms, and the product detail page (lifecycle
transitions, metadata editor, external mappings). Pairs with the headless
`@granit/react-catalog` data layer (`CatalogProvider`, `useProduct`,
`useCreateProduct`, `useUpdateProduct`, lifecycle + mapping + metadata mutations).

## Usage

The host app supplies the `CatalogProvider` (with its API client and base path);
the pages here only consume the hooks. The smart-filter grid additionally needs a
`QueryProvider` from `@granit/react-query-engine` (the `CatalogListPage` wires its
own from `QUERY_CONFIG`).

```tsx
import { CatalogProvider } from '@granit/react-catalog';
import { CatalogListPage } from '@granit/react-ui-catalog';

<CatalogProvider config={{ client, basePath: '/api/v1/catalog' }}>
  <CatalogListPage />
</CatalogProvider>;
```

## Pages & components

- `CatalogListPage` — smart-filtered, sortable, server-paginated products grid.
- `CatalogCreatePage` / `CatalogEditPage` — spec-validated product forms.
- `CatalogDetailPage` — product info, lifecycle actions, metadata, mappings.
- Sub-components: `LifecycleActions`, `LifecycleStatusBadge`, `MetadataEditor`,
  `ExternalMappingsManager`, `createProductColumns`.

## i18n

Ships flat `Catalog.*` keys in the `translation` namespace via
`catalogTranslationsEn` / `catalogTranslationsFr`. Register them in the host i18n
instance with `addResourceBundle(lng, 'translation', bundle, true, true)`. The
shared `Common.*` / `Operators.*` keys belong to the host application root.

## Validation

The product forms derive validation from the OpenAPI contract via
`createConstraintsResolver(catalogConstraints.ProductCreateRequest | ProductUpdateRequest | AddProductExternalMappingRequest, …)`
(`@granit/react-validation` + `@granit/catalog`) — no hand-written schema.
