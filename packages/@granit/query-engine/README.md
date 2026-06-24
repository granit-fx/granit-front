<img src="https://granit-fx.dev/images/granit-icon.svg" alt="" height="32" align="left" style="margin-right:10px" />

# @granit/query-engine

Endpoint-agnostic **query SDK** — the framework-level TypeScript counterpart of the
.NET `Granit.QueryEngine` module. It drives any domain list endpoint that mounts the
Granit query surface (server-side pagination, filtering, sorting, grouping, presets,
quick filters, and saved views) at its own collection root.

This is the framework-agnostic **core** layer: it exposes the DTO types, the Axios HTTP
calls, the request/URL serializer, the validation clamps, and the pure operator helpers
needed to drive a query from any client — React, React Native, a CLI, tests. It holds
**no** React, DOM or Node-only dependency. The React Query hooks, providers and the
SmartFilter state machine live in [`@granit/react-query-engine`](../react-query-engine);
there is no `react-ui` admin feature kit — domain feature kits compose the hooks
directly.

QueryEngine is cross-cutting, not a standalone HTTP module: there is **no**
`query-engine.json` contract. Each domain mounts the query surface at its own
`basePath` (`/api/v1/parties`, `/api/v1/patients`, …), so the same calls and types work
for every list endpoint. The DTOs mirror the .NET `Granit.QueryEngine.*` shapes; domain
packages parameterise the row type `T` and pass their own `basePath`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published to
a public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors)
  passed into every call.
- `@granit/data-lookup` — `LookupDescriptor`, carried on `FilterableField.lookup` to
  route a filter's value phase to a server-backed typeahead.
- `@granit/utils` — shared utilities.

## Quick start

```ts
import {
  getPage,
  getQueryMeta,
  serializeQueryRequest,
  inferOperators,
  listSavedViews,
} from '@granit/query-engine';
import type { QueryRequest } from '@granit/query-engine';

// `basePath` is the domain collection root — it encodes the endpoint, so the
// same calls work for parties, patients, invoices, …
const basePath = '/api/v1/parties';

// 1. Describe the request. It is validated + clamped to server limits on
//    serialization (page >= 1, pageSize <= 500, filters <= 50, …).
const request: QueryRequest = {
  page: 1,
  pageSize: 20,
  search: 'acme',
  filters: [{ field: 'status', operator: 'Eq', value: 'Active' }],
  sort: [{ field: 'createdAt', direction: 'desc' }],
  quickFilters: ['Mine'],
};

// 2. Fetch a page. The row type T is the caller's domain DTO.
const page = await getPage<PartySummary>(client, basePath, request);
// page.items, page.totalCount (null when skipTotalCount), page.nextCursor

// 3. Metadata drives the UI: columns, filterable fields + allowed operators,
//    presets, quick filters, pagination defaults.
const meta = await getQueryMeta(client, basePath);
const ops = inferOperators(meta.filterableFields[0]!.type); // e.g. NUMBER_OPERATORS

// 4. Reflect the request in the URL (no leading '?'); parseQueryRequest inverts it.
const qs = serializeQueryRequest(request);

// 5. Per-user / shared saved views are namespaced under the same basePath.
const views = await listSavedViews(client, basePath);
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `QueryRequest` | type | Full request: page/cursor, search, filters, sort, presets, etc. |
| `PaginationParams` | type | `page` / `pageSize` base shared across modules |
| `FilterEntry`, `FilterOperator` | type | One `field` + `operator` + `value` predicate; operator union |
| `SortEntry`, `SortDirection` | type | Ordered sort spec (`-field` = descending on the wire) |
| `PagedResult<T>` | type | `items`, nullable `totalCount`, `hasMore`, `nextCursor` |
| `GroupedResult<T>`, `GroupEntry<T>` | type | `groupBy` response: per-group `value`/`label`/`count`/aggregates |
| `QueryMetadata` | type | `GET {basePath}/meta` shape (columns, fields, presets) |
| `ColumnDefinition`, `FilterableField`, `SortableField` | type | Metadata members; `FilterableField.lookup` routes to a data-lookup picker |
| `FilterGroupMeta`, `PresetMeta`, `QuickFilterMeta` | type | Preset groups (OR-in / AND-between) and toggleable quick filters |
| `DateFilterMeta`, `DatePeriod` | type | Period-based date filtering metadata + period union |
| `GroupByField`, `PaginationMeta` | type | Group-by fields; pagination defaults/limits/cursor support |
| `SavedViewSummary` | type | Saved-view list item (`isShared`, `isDefault`) |
| `CreateSavedViewRequest`, `UpdateSavedViewRequest` | type | Saved-view write bodies (filter/sort/group/columns as JSON) |
| `FilterToken`, `FilterTokenType`, `FilterSuggestion` | type | SmartFilterBar omnibox tokens + cmdk suggestions |
| `FilterSuggestionValue`, `SmartFilterPhase` | type | Suggested value pair; input state machine phase |
| `QueryConfig`, `ResolvedQueryConfig` | type | Per-endpoint config (`client`, `basePath`, `queryKeyPrefix`) |
| `getPage` | fn | `GET {basePath}?...` paginated/cursor page (`AbortSignal` aware) |
| `getGrouped` | fn | `GET {basePath}?...&groupBy=` grouped page |
| `getQueryMeta` | fn | `GET {basePath}/meta` metadata fetch |
| `serializeQueryRequest`, `parseQueryRequest` | fn | `QueryRequest` to/from URL search string (validated on serialize) |
| `listSavedViews`, `createSavedView`, `updateSavedView` | fn | Saved-view CRUD under `{basePath}/saved-views` |
| `deleteSavedView`, `setDefaultSavedView` | fn | Delete; `POST .../{id}/set-default` |
| `buildQueryKey` | fn | TanStack Query key from `QueryConfig` + extra segments |
| `validateQueryRequest` | fn | Clamp/truncate a request to `QUERY_LIMITS` (no throw) |
| `inferOperators` | fn | CLR type name to allowed `FilterOperator[]` |
| `STRING_OPERATORS`, `NUMBER_OPERATORS`, `DATE_OPERATORS` | const | Per-type operator whitelists |
| `BOOLEAN_OPERATORS`, `ENUM_OPERATORS` | const | Operator whitelists for boolean and enum/GUID fields |
| `OPERATOR_LABELS` | const | `FilterOperator` to human-readable label (`Eq` to `=`) |
| `QUERY_LIMITS` | const | Server-enforced limits (page sizes, max counts, lengths) |

## Out of scope / caveats

- **Client validation is a guard rail, not the boundary.** `serializeQueryRequest`
  runs `validateQueryRequest`, which silently *clamps* and *truncates* to `QUERY_LIMITS`
  (no throw, no error). The backend independently re-validates and answers `422` on its
  own limits — never assume a request survived the round trip unchanged.

- **`totalCount` is nullable by design.** With `skipTotalCount: true` the backend omits
  the expensive `COUNT(*)`; `PagedResult.totalCount` is then `null`. Treat it as nullable
  and fall back to `hasMore` / `nextCursor` for cursor pagination.

- **`page` and `cursor` are mutually exclusive.** When both are set the serializer drops
  `page` (cursor wins). Mirror that in calling code rather than sending both.

- **Saved-view payloads are opaque JSON strings.** `filterJson` / `sortJson` /
  `groupByJson` / `visibleColumnsJson` are serialized client-side and stored verbatim;
  this package does not parse or validate them.

- **No React, no hooks, no UI.** Wiring into React Query, the `QueryProvider`, infinite
  scroll/pagination, and the SmartFilterBar all live in
  [`@granit/react-query-engine`](../react-query-engine). The `QueryConfig.client` is
  optional precisely so that layer can resolve the `AxiosInstance` from context; in the
  core calls here, pass the `client` explicitly.

## License

Apache-2.0
