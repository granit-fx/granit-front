# @granit/react-ui-reference-data

Admin UI **feature kit** for the Granit **reference-data** module — the generic,
prefix-injected building blocks (list / create / edit page shells, spec-validated
form, columns factory, card, category tree view, metadata editor, deactivate
dialog) that domain features (countries, document-types, product-categories…)
compose into concrete admin pages.

This is the **react-ui** layer: it renders. It composes the headless
[`@granit/react-reference-data`](../react-reference-data) hooks factory with the
foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit),
[`@granit/react-ui-data-exchange`](../react-ui-data-exchange)) and spec validation
([`@granit/react-validation`](../react-validation)). Nothing is hard-wired: each
shell takes an `i18nPrefix`, a `basePath`, a `QueryConfig`, and the domain
feature's own mutations, so the same kit drives any reference-data collection.

The split is three packages over the same .NET `Granit.ReferenceData` backend
(contract: `contracts/openapi/reference-data.json`):

- [`@granit/reference-data`](../reference-data) — framework-agnostic core: DTOs
  (`ReferenceDataEntry`, `ReferenceData{Create,Update}Request`) + Axios functions
  (`listReferenceData`, `getReferenceDataEntry`, `updateReferenceDataEntry`, …).
- [`@granit/react-reference-data`](../react-reference-data) — React Query hooks
  factory (`createReferenceDataHooks`); headless, no rendering.
- `@granit/react-ui-reference-data` (this package) — admin UI kit: page shells,
  form, columns, card, tree view, dialogs.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers (all `workspace:*` unless noted):

- `@granit/react-reference-data` — the headless hooks factory the shells drive.
- `@granit/reference-data` — core DTOs (re-exports `ReferenceDataEntry`).
- `@granit/react-ui` — shadcn/ui primitives (form, card, dialog, table, toast).
- `@granit/react-ui-admin-kit` — the query grid + smart-filter / sort / view
  controls (`QueryDataTable`, `SmartFilterBar`, `ViewSwitcher`, …).
- `@granit/react-ui-data-exchange` + `@granit/react-data-exchange` — the
  export/import buttons and dialogs and their provider.
- `@granit/react-query-engine` + `@granit/query-engine` — `QueryProvider`,
  `useQueryEndpoint`/`useQueryMeta`/`useSmartFilter`, and `QueryConfig`.
- `@granit/react-validation` + `@granit/validation` — `createConstraintsResolver`
  / `useFieldProps` over the hand-written `SchemaConstraints`.
- `@granit/react-localization` — `useTranslation` (i18n).
- `@granit/logger`, `@granit/types`, `@granit/utils` — logging, base types, `cn`.
- `@tanstack/react-table` (`^8.21`) — `ColumnDef` for the columns factory.
- `react` (`^19`), `react-dom` (`^19`), `react-hook-form` (`^7.80`),
  `react-router` (`^7.18`) — runtime, form state, list-to-detail navigation.
- `lucide-react` (`^1.21`) — icons.

## Quick start

A domain feature builds its headless hooks once with `createReferenceDataHooks`,
registers the default i18n bundle, then feeds the resulting mutations and a
`QueryConfig` into the shells. The list shell wraps its own `QueryProvider` /
`DataExchangeProvider` from the supplied configs — the Axios client itself is
resolved from a `GranitClientProvider` higher in the tree.

```tsx
import { createReferenceDataHooks } from '@granit/react-reference-data';
import {
  ReferenceDataListPageShell,
  createReferenceDataColumns,
  referenceDataTranslationsEn,
} from '@granit/react-ui-reference-data';
import { useTranslation } from '@granit/react-localization';
import { useGranitClient } from '@granit/react-api-client';

// Register the kit's default `ReferenceData.Common.*` strings once at boot.
i18n.addResourceBundle('en', 'translation', referenceDataTranslationsEn, true, true);

const countries = createReferenceDataHooks({ basePath: '/countries' });

function CountriesListPage({ queryConfig }: { queryConfig: QueryConfig }) {
  const { t } = useTranslation();
  const client = useGranitClient();

  const deactivate = countries.useDeactivate({ client });
  const update = countries.useUpdate({ client });

  const columns = createReferenceDataColumns({
    t,
    i18nPrefix: 'Countries',
    onEdit: (code) => navigate(`/countries/${code}`),
    onDeactivate: (entry) => deactivate.mutateAsync(entry.code),
    onReactivate: (entry) =>
      update.mutateAsync({ code: entry.code, data: { labelEn: entry.labelEn, activated: true } }),
  });

  return (
    <ReferenceDataListPageShell
      i18nPrefix="Countries"
      basePath="/countries"
      queryConfig={queryConfig}
      exportDefinition="Showcase.CountryExport"
      importDefinition="Showcase.CountryImport"
      columns={columns}
      deactivateMutation={deactivate}
      updateMutation={update}
    />
  );
}
```

The create/edit pages combine a shell with `ReferenceDataForm`, validated by the
hand-written constraints:

```tsx
import {
  ReferenceDataCreatePageShell,
  ReferenceDataForm,
  createReferenceDataConstraints,
} from '@granit/react-ui-reference-data';

function CountryCreatePage() {
  const create = countries.useCreate({ client: useGranitClient() });
  return (
    <ReferenceDataCreatePageShell i18nPrefix="Countries" basePath="/countries">
      <ReferenceDataForm
        mode="create"
        i18nPrefix="Countries"
        constraints={createReferenceDataConstraints}
        isPending={create.isPending}
        onSubmit={async (data) => {
          await create.mutateAsync(data);
        }}
        onCancel={() => navigate('/countries')}
      />
    </ReferenceDataCreatePageShell>
  );
}
```

## Public API

| Symbol                            | Kind      | Purpose                                                               |
| --------------------------------- | --------- | --------------------------------------------------------------------- |
| `ReferenceDataListPageShell`      | component | Query grid: smart filters, export/import, card/tree, deactivate       |
| `ReferenceDataCreatePageShell`    | component | Create-page chrome (back link + title) wrapping the form              |
| `ReferenceDataEditPageShell`      | component | Edit-page chrome: loading/not-found states, badge, deactivate action  |
| `ReferenceDataForm`               | component | Spec-validated create/edit form; `mode` discriminates create vs edit  |
| `createReferenceDataColumns`      | fn        | `ColumnDef[]` factory (code, label, status, metadata, actions menu)   |
| `ReferenceDataCard`               | component | Single-entry card for the card view, with an app-content slot         |
| `CategoryTreeView`                | component | Lazy-expanding tree; fetches children via an injected `useChildren`   |
| `MetadataEditor`                  | component | Field-array editor for the `metadata` key/value bag (datalist hints)  |
| `ReferenceDataDeactivateDialog`   | component | Confirm dialog for deactivate/reactivate of one entry                 |
| `createReferenceDataConstraints`  | const     | `SchemaConstraints` for `ReferenceDataCreateRequest` (with `code`)    |
| `editReferenceDataConstraints`    | const     | `SchemaConstraints` for `ReferenceDataUpdateRequest` (no `code`)      |
| `referenceDataTranslationsEn`     | const     | Default `ReferenceData.Common.*` English i18n bundle                  |
| `referenceDataTranslationsFr`     | const     | Default `ReferenceData.Common.*` French i18n bundle                   |
| `ReferenceDataEntry`              | type      | Re-export of the core entry DTO (the generic `T` the shells use)      |
| `ReferenceDataFormValues`         | type      | Shared form-value shape (labels, code?, validity, sort, metadata)     |
| `CreateReferenceDataFormValues`   | type      | `ReferenceDataFormValues` with `code` required                        |
| `EditReferenceDataFormValues`     | type      | `ReferenceDataFormValues` without `code`                              |
| `ReferenceDataListPageShellProps` | type      | List-shell props (`i18nPrefix`, `basePath`, `queryConfig`, mutations) |

## Injection contract

- **Headless data layer** — the consumer builds hooks via
  `createReferenceDataHooks` from `@granit/react-reference-data` and passes the
  resulting mutations / `queryConfig` into the shells. No client is baked in.
- **API client** — resolved from a `GranitClientProvider` / `QueryProvider` higher
  in the tree; the list shell wraps its own `QueryProvider` /
  `DataExchangeProvider` from the supplied configs.
- **Validation** — `createConstraintsResolver` / `useFieldProps` from
  `@granit/react-validation` over the hand-written `SchemaConstraints` in
  `./validation` (mirrors the resolved `ReferenceData{Create,Update}Request`
  OpenAPI constraints — `code` matches `^[A-Z0-9_-]+$`, labels ≤ 250 chars).
- **Routing** — `react-router` (`Link` / `useNavigate`) for list-to-detail
  navigation and back links.
- **i18n** — ships its default `ReferenceData.Common.*` strings
  (`referenceDataTranslationsEn/Fr`); each domain feature normally passes its own
  `i18nPrefix` (e.g. `Countries`) and registers those keys. The host registers the
  bundle.

## Out of scope / caveats

- **Headless data + DTOs** — query-key factory, React Query hooks, Axios calls and
  wire DTOs live in [`@granit/react-reference-data`](../react-reference-data) and
  [`@granit/reference-data`](../reference-data). This package only renders.
- **Authorization is a UX hint, not a boundary.** The shells hide and gate
  controls but do **not** enforce permissions; `Granit.ReferenceData` re-checks
  every read/mutate on the .NET backend. Never fetch protected data and hide it in
  the browser.
- **Structural mutation typing.** `ReferenceDataListPageShellProps` accepts a
  `MutationLike` shape (`{ mutateAsync, isPending }`) rather than
  `UseMutationResult` on purpose: granit-front and showcase-react may resolve
  different `@tanstack/react-query` copies whose `QueryClient` `#private` field
  makes the full result types non-assignable. Pass the hook results directly — the
  structural type matches.
- **Untyped tree-view injection.** `CategoryTreeView`'s `useChildren` /
  `apiClient` props are intentionally `any`-typed so the component stays agnostic
  to the domain feature's concrete hook/client instances; wire the
  `createReferenceDataHooks().useChildren` and the resolved client.
- **`code` is immutable.** It is present on create (`createReferenceDataConstraints`,
  uppercased on input) and absent on edit (`editReferenceDataConstraints`,
  `EditReferenceDataFormValues`); do not surface a code field in edit mode.
- **No `testing/` subpath.** This kit ships no MSW handlers; mock at the headless
  hook layer or in the consuming app's fixtures.

## License

Apache-2.0
