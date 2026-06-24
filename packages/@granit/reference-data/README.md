# @granit/reference-data

Generic **reference data** SDK — the framework-level TypeScript counterpart of the
.NET `Granit.ReferenceData` module (contract:
`contracts/openapi/reference-data.json`). Reference data is the set of
slowly-changing, code-keyed lookup tables an app classifies against — countries,
currencies, languages, units, document types, taxonomy nodes — each entry carrying a
stable `code`, fourteen multilingual labels, an activation window, an optional parent
for hierarchical sets, and a free-form metadata bag.

This is the framework-agnostic **core** layer: it exposes the DTOs and the Axios HTTP
functions needed to drive reference-data CRUD from any client — React, React Native, a
CLI, tests. It holds **no** React, DOM or Node-only dependency. Every call is
`basePath`-parameterized, so the same six functions serve every reference-data
collection an app mounts. The React Query hooks layer lives in
[`@granit/react-reference-data`](../react-reference-data) (a `createReferenceDataHooks`
factory), and the admin feature kit — forms, columns, tree view, page shells — lives in
[`@granit/react-ui-reference-data`](../react-ui-reference-data).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published to
a public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/query-engine` — `PagedResult` (list response) and `PaginationParams`
  (`ReferenceDataQuery` base).
- `@granit/types` — `EntityId` brand and `ISODateString` for the entry id and validity
  window.

## Quick start

```ts
import {
  listReferenceData,
  getReferenceDataEntry,
  createReferenceDataEntry,
  updateReferenceDataEntry,
  listReferenceDataChildren,
  deactivateReferenceDataEntry,
  type ReferenceDataEntry,
} from '@granit/reference-data';

// `basePath` is the collection root — it selects the reference-data set, so the
// same calls work for countries, currencies, document types, …
const basePath = '/api/v1/reference-data/countries';

// A concrete set extends the base entry with its own fields (server-computed `label`
// resolves to the active UI culture).
interface Country extends ReferenceDataEntry {
  readonly iso3: string;
}

// 1. List — paginated, active-only by default; free-text `search` over code + labels.
const page = await listReferenceData<Country>(client, basePath, {
  search: 'bel',
  page: 1,
  pageSize: 50,
});

// 2. Read one by its immutable code.
const be = await getReferenceDataEntry<Country>(client, basePath, 'BE');

// 3. Create — only `code` + `labelEn` are required; `activated` is true on creation.
await createReferenceDataEntry(client, basePath, { code: 'LU', labelEn: 'Luxembourg' });

// 4. Update — `code` stays in the path, never in the body.
await updateReferenceDataEntry(client, basePath, 'LU', { labelEn: 'Luxembourg', sortOrder: 10 });

// 5. Hierarchical sets: list a node's direct, active children (ordered).
const regions = await listReferenceDataChildren<Country>(client, basePath, 'EU');

// 6. Deactivate (soft delete) — entries are never hard-deleted.
await deactivateReferenceDataEntry(client, basePath, 'LU');
```

## Public API

| Symbol                         | Kind | Purpose                                                                  |
| ------------------------------ | ---- | ------------------------------------------------------------------------ |
| `ReferenceDataEntry`           | type | Base entry: code, resolved label, 14 labels, validity, parent, metadata  |
| `ReferenceDataEntryId`         | type | Branded `EntityId<'ReferenceDataEntry'>`                                 |
| `ReferenceDataLabels`          | type | The 14 multilingual label fields (`labelEn` through `labelCs`)           |
| `ReferenceDataCreateRequest`   | type | `POST {basePath}` body (`code` + `labelEn` required)                     |
| `ReferenceDataUpdateRequest`   | type | `PUT {basePath}/{code}` body (`code` immutable, in the path)             |
| `ReferenceDataQuery`           | type | List params: `activeOnly`, `search`, `sortBy`, `descending` + pagination |
| `listReferenceData`            | fn   | `GET {basePath}` returns `PagedResult<T>` (active-only by default)       |
| `getReferenceDataEntry`        | fn   | `GET {basePath}/{code}` returns a single entry                           |
| `createReferenceDataEntry`     | fn   | `POST {basePath}` (returns `void`)                                       |
| `updateReferenceDataEntry`     | fn   | `PUT {basePath}/{code}` (returns `void`)                                 |
| `listReferenceDataChildren`    | fn   | `GET {basePath}/{code}/children` returns active children, ordered        |
| `deactivateReferenceDataEntry` | fn   | `DELETE {basePath}/{code}` - soft delete (returns `void`)                |

All five typed read/list functions take a generic `T extends ReferenceDataEntry`,
letting a domain set narrow the response to its own shape (e.g. `Country`) without
re-declaring the base contract.

## Out of scope / caveats

- **No fixed set.** This package ships no country/currency/language list and no domain
  types — only the generic contract. A concrete set is just a `basePath` plus a
  `ReferenceDataEntry` extension declared in the consuming app or domain package.
- **Activation, not deletion.** `deactivateReferenceDataEntry` is a soft delete;
  entries are deactivated (and excluded by the default `activeOnly`), never removed.
  Pass `activeOnly: false` to `listReferenceData` to see deactivated entries.
- **`code` is immutable.** It is the natural key — it travels in the path on read,
  update, children, and delete, and is absent from `ReferenceDataUpdateRequest`.
- **`label` is server-computed.** The resolved `label` reflects the active UI culture
  and is not persisted; write through the 14 `label*` fields instead.
- **React hooks and rendering live elsewhere.** TanStack Query hooks are in
  [`@granit/react-reference-data`](../react-reference-data) (built from the
  `createReferenceDataHooks` factory); forms, grid columns, the category tree view, and
  page shells are in [`@granit/react-ui-reference-data`](../react-ui-reference-data).
  This package is headless and React-free.

## License

Apache-2.0
