# @granit/react-reference-data

React Query **hooks factory** for the Granit **reference-data** module — multilingual,
code-keyed lookup tables (countries, currencies, languages, document types, product
categories, …). This is the **React hooks layer**: a single `createReferenceDataHooks<T>()`
factory wraps the framework-agnostic Axios calls and DTOs from
[`@granit/reference-data`](../reference-data) in TanStack Query query/mutation hooks with
an isolated query-key factory. It holds no rendering — forms, columns, tree views, and page
shells live one layer up.

Unlike most Granit react packages there is **no `Provider`**: reference-data is generic over
the entity type, so each app calls the factory once per entity (`'countries'`,
`'product-categories'`, …) and passes the Axios `client` per hook call. The split is three
packages over the same .NET `Granit.ReferenceData` backend (contract:
`contracts/openapi/reference-data.json`):

- [`@granit/reference-data`](../reference-data) — framework-agnostic core: DTOs
  (`ReferenceDataEntry`, `ReferenceData{Create,Update}Request`, `ReferenceDataQuery`) +
  Axios functions (`listReferenceData`, `getReferenceDataEntry`, …).
- `@granit/react-reference-data` (this package) — the `createReferenceDataHooks` factory +
  generic MSW testing kit.
- [`@granit/react-ui-reference-data`](../react-ui-reference-data) — admin UI kit: form,
  metadata editor, data-grid columns, deactivate dialog, category tree, and page shells.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published for app
consumption through a public registry. A consumer must declare these peers:

- `@granit/reference-data` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors)
  passed into every hook call.
- `@granit/query-engine` — `PagedResult` / `PaginationParams` for the list surface.
- `@granit/types` — shared base types (`EntityId`, `ISODateString`).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-reference-data/testing` subpath.

## Quick start

Call the factory once per entity type — typically in a small module next to the feature — to
get fully typed hooks with isolated query keys. Extend `ReferenceDataEntry` with your
domain-specific fields, then pass the Axios client into each hook.

```tsx
import { createReferenceDataHooks } from '@granit/react-reference-data';
import { useGranitClient } from '@granit/react-api-client';
import type { ReferenceDataEntry } from '@granit/reference-data';

interface Country extends ReferenceDataEntry {
  readonly alpha3: string;
  readonly region: string;
}

// One call per entity → typed hooks + a dedicated query-key namespace.
// `entityName` is the plural, kebab-cased backend route segment.
const countries = createReferenceDataHooks<Country>('countries');

function CountryList() {
  const client = useGranitClient();
  const { data, isLoading } = countries.useList({ client, params: { activeOnly: true } });
  if (isLoading) return null;

  // `useList` returns a PagedResult<Country>.
  return (
    <ul>
      {data?.items.map((c) => (
        <li key={c.code}>{c.label}</li>
      ))}
    </ul>
  );
}

function DeactivateButton({ code }: { code: string }) {
  const client = useGranitClient();
  const { mutate } = countries.useDeactivate({ client });
  // Soft delete — DELETE flips `activated` to false; the list query is invalidated.
  return <button type="button" onClick={() => mutate(code)}>Deactivate</button>;
}
```

The factory return object bundles the query-key factory plus seven hooks:

```tsx
const {
  keys, // query-key factory: keys.all / keys.list(params) / keys.detail(code) / keys.children(code)
  useList, // GET {basePath}            → PagedResult<T>
  useEntry, // GET {basePath}/{code}     → T
  useChildren, // GET {basePath}/{code}/children → T[]   (hierarchical types)
  useCreate, // POST {basePath}           (invalidates lists)
  useUpdate, // PUT {basePath}/{code}     (invalidates list + that detail)
  useDeactivate, // DELETE {basePath}/{code}  (invalidates list + that detail)
} = createReferenceDataHooks<Country>('countries');
```

`basePath` defaults to `/api/v1/reference-data/{entityName}` and can be overridden globally
via the factory's `defaultBasePath` option or per call via each hook's `basePath` option.

## Public API

The barrel exports the factory and its option types. The seven hooks and the `keys` factory
are **return values** of `createReferenceDataHooks`, not top-level symbols.

| Symbol                             | Kind | Purpose                                                                                    |
| ---------------------------------- | ---- | ------------------------------------------------------------------------------------------ |
| `createReferenceDataHooks<T>`      | fn   | Factory -> `{ keys, useList, useEntry, useChildren, useCreate, useUpdate, useDeactivate }` |
| `CreateReferenceDataHooksOptions`  | type | Factory input - `{ defaultBasePath? }`                                                     |
| `ReferenceDataListHookOptions`     | type | `useList` input - `{ client, basePath?, params?, enabled? }`                               |
| `ReferenceDataEntryHookOptions`    | type | `useEntry` input - `{ client, basePath?, enabled? }`                                       |
| `ReferenceDataChildrenHookOptions` | type | `useChildren` input - `{ client, basePath?, enabled? }`                                    |
| `ReferenceDataMutationHookOptions` | type | Mutation hook input - `{ client, basePath? }`                                              |
| `ReferenceDataUpdateVariables`     | type | `useUpdate` variables - `{ code, data }`                                                   |
| `ReferenceDataKeys`                | type | Shape of the returned query-key factory                                                    |

### Returned hooks (created by the factory)

| Hook            | Kind | Purpose                                                                    |
| --------------- | ---- | -------------------------------------------------------------------------- |
| `useList`       | hook | `GET {basePath}` - paginated `PagedResult<T>`, `staleTime` default         |
| `useEntry`      | hook | `GET {basePath}/{code}` - single `T`; disabled on empty `code`             |
| `useChildren`   | hook | `GET {basePath}/{code}/children` - active children `T[]` (hierarchy)       |
| `useCreate`     | hook | `POST {basePath}` mutation; invalidates `keys.lists()`                     |
| `useUpdate`     | hook | `PUT {basePath}/{code}` mutation; invalidates list + that detail           |
| `useDeactivate` | hook | `DELETE {basePath}/{code}` (soft delete); invalidates list + detail        |
| `keys`          | fn   | Query-key factory namespaced by `entityName` (`all/list/detail/children`)  |

### `./testing` subpath

Requires the optional `msw` peer. A **data-agnostic** MSW handler factory for reference-data
style endpoints — list/get/children/CRUD with filter, search, sort, group-by, and an
active/inactive status preset. Each `createReferenceDataHandlers` call owns an isolated,
mutable store.

| Symbol                        | Kind  | Purpose                                                          |
| ----------------------------- | ----- | ---------------------------------------------------------------- |
| `createReferenceDataHandlers` | fn    | Stateful MSW handlers for one resource `basePath` + seed/meta    |
| `ReferenceDataHandlersConfig` | type  | Handler config (basePath, seed, meta, searchFields, createEntry) |
| `applyStatusPreset`           | fn    | Reusable `presets[status]=active,inactive` filter on `activated` |
| `buildBaseEntry`              | fn    | Build a `ReferenceDataEntry` from a `Partial` POST body          |
| `emptyLabels`                 | const | Zeroed defaults for the 14 localized label fields                |

## Caveats

- **No provider, client per call.** This package is generic over the entity type, so there
  is intentionally no `ReferenceDataProvider`. Pass the `AxiosInstance` (from
  `@granit/react-api-client`'s `useGranitClient`) into every hook's `client` option; do not
  reach for a context that does not exist.
- **`code` is the key, not `id`.** Entries are addressed by their immutable string `code`
  (uppercased server-side) in every detail/mutation route; `id` is a branded `EntityId` used
  only for React keys and joins.
- **Deactivate is a soft delete.** `useDeactivate` issues `DELETE` but the backend flips
  `activated` to `false` — entries are never physically removed. List queries default to
  `activeOnly`, so deactivated entries simply drop out unless you query with `activeOnly:
  false`.
- **Hierarchy is opt-in.** `useChildren` only returns rows for hierarchical entity types
  (those with `parentCode`); the testing handler returns `[]` unless its config sets
  `hierarchical: true`.

## Out of scope

- **Rendering** — forms, the metadata editor, grid columns, the deactivate dialog, the
  category tree, and create/edit/list page shells live in
  [`@granit/react-ui-reference-data`](../react-ui-reference-data). This package is headless.
- **DTOs and HTTP transport** — owned by [`@granit/reference-data`](../reference-data)
  (mirror of `Granit.ReferenceData`); the factory here only adapts those Axios calls to
  React Query.
- **Form validation** — input constraints (`createReferenceDataConstraints`,
  `editReferenceDataConstraints`) are derived from the OpenAPI spec and live in the UI kit.

## License

Apache-2.0
