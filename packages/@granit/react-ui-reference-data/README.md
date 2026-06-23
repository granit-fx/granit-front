# @granit/react-ui-reference-data

Admin UI **toolkit** for the **Reference-Data** module — the generic,
prefix-injected building blocks that domain features (countries, document-types,
product-categories…) compose into concrete admin pages:

- **Page shells** — `ReferenceDataListPageShell` (query-driven grid with smart
  filters, export/import, optional card / tree views and per-row deactivate /
  reactivate), `ReferenceDataCreatePageShell`, `ReferenceDataEditPageShell`.
- **Form** — `ReferenceDataForm`, a spec-validated create/edit form
  (labels, code, validity window, sort order, metadata) driven by hand-written
  `SchemaConstraints` (`createReferenceDataConstraints` / `editReferenceDataConstraints`).
- **Components** — `createReferenceDataColumns`, `ReferenceDataCard`,
  `CategoryTreeView`, `MetadataEditor`, `ReferenceDataDeactivateDialog`.

This is the **visual** layer: it composes the headless
[`@granit/react-reference-data`](../react-reference-data) hooks factory with the
foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit),
[`@granit/react-ui-data-exchange`](../react-ui-data-exchange)) and spec
validation ([`@granit/react-validation`](../react-validation)).

## Usage

```tsx
import {
  ReferenceDataListPageShell,
  ReferenceDataForm,
  createReferenceDataColumns,
  createReferenceDataConstraints,
  referenceDataTranslationsEn,
} from '@granit/react-ui-reference-data';

i18n.addResourceBundle('en', 'translation', referenceDataTranslationsEn, true, true);

// A domain feature wires its own headless hooks, query config, mutations and
// i18nPrefix into the shells:
<ReferenceDataListPageShell
  i18nPrefix="Countries"
  basePath="/countries"
  queryConfig={queryConfig}
  exportDefinition="Showcase.CountryExport"
  importDefinition="Showcase.CountryImport"
  columns={columns}
  deactivateMutation={deactivate}
  updateMutation={update}
/>;
```

## Injection

- **Headless data layer** — the consumer builds hooks via
  `createReferenceDataHooks` from `@granit/react-reference-data` and passes the
  resulting mutations / query config into the shells. No client is baked in.
- **API client** — resolved from a `GranitClientProvider` / `QueryProvider`
  higher in the tree; the list shell wraps its own `QueryProvider` /
  `DataExchangeProvider` from the supplied configs.
- **Validation** — `createConstraintsResolver` / `useFieldProps` from
  `@granit/react-validation` over the hand-written `SchemaConstraints` in
  `./validation` (mirrors the resolved `CreateReferenceDataRequest` /
  `UpdateReferenceDataRequest` OpenAPI constraints).
- **Routing** — `react-router-dom` (`Link` / `useNavigate`) for list-to-detail
  navigation and back links.
- **i18n** — ships its default `ReferenceData.Common.*` strings
  (`referenceDataTranslationsEn/Fr`); each domain feature normally passes its own
  `i18nPrefix` (e.g. `Countries`) and registers those keys. The host registers
  the bundle.
