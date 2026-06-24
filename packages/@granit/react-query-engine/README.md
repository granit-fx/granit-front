# @granit/react-query-engine

React bindings for [`@granit/query-engine`](../query-engine) — the React Query hooks,
providers, and headless state machines that drive a Granit list surface (server-side
pagination, filtering, sorting, grouping, presets, quick filters) from a component tree.

This is the **React hooks layer**: it wraps the framework-agnostic Axios calls and DTOs
from [`@granit/query-engine`](../query-engine) in TanStack Query, adds a `QueryProvider`
for client/base-path configuration, and ships headless reducers (`useQueryEndpoint`,
`useSmartFilter`) — no rendering. Grids, SmartFilterBars, and toolbars live one layer up
in the domain feature kits that compose these hooks; there is **no** `react-ui` sibling
for this package. QueryEngine is cross-cutting infra, not a standalone HTTP module: each
domain mounts the query surface at its own `basePath` (`/api/v1/parties`,
`/api/v1/patients`, …), so there is **no** backend `query-engine.json` contract — the
same hooks work against every queryable resource.

The split is two packages over the same `Granit.QueryEngine` query surface:

- [`@granit/query-engine`](../query-engine) — framework-agnostic core: DTOs, Axios calls
  (`getPage`, `getGrouped`, `getQueryMeta`), the URL serializer, and pure helpers.
- `@granit/react-query-engine` (this package) — React Query hooks, providers, and the
  SmartFilter / query-endpoint state machines.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published for
app consumption through a public registry. A consumer must declare these peers:

- `@granit/query-engine` — core DTOs (`QueryRequest`, `QueryMetadata`, `PagedResult`,
  `FilterEntry`, …) and Axios calls this layer wraps.
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for the
  Axios client when `config.client` is omitted.
- `@granit/data-lookup` — `LookupDescriptor`, used by `useSmartFilter` to wire
  lookup-backed filter values (cascading typeahead pickers).
- `@granit/utils` — shared helpers.
- `@tanstack/react-query` (`^5`), `react` (`^19`), `react-dom` (`^19`).
- `axios` (`^1.6`) — peer of the underlying client.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-query-engine/testing`
  subpath.
- `@tanstack/react-virtual` (**optional**) — only if the consuming grid virtualizes;
  not imported by this package.

## Quick start

Wire `QueryProvider` once (it resolves the Axios client and base path), then call the
hooks anywhere below it. Solo mode — one component owns both the toolbar and the fetch:

```tsx
import { QueryProvider, useQueryEndpoint, useQueryMeta } from '@granit/react-query-engine';
import { useGranitClient } from '@granit/react-api-client';

function PatientsPage() {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <QueryProvider config={{ basePath: '/api/v1/patients', client: useGranitClient() }}>
      <PatientList />
    </QueryProvider>
  );
}

function PatientList() {
  const { query, params, setSearch, setPage, toggleSort } = useQueryEndpoint<Patient>();

  if (query.isLoading) return <Spinner />;
  const { items, totalCount } = query.data!;

  return (
    <table>
      <thead>
        <tr onClick={() => toggleSort('lastName')}>{/* asc → desc → off */}</tr>
      </thead>
      <tbody>{items.map(renderRow)}</tbody>
    </table>
  );
}
```

Shared mode — mount `QueryEndpointStateProvider` so a toolbar and a renderer beneath it
talk to one reducer (toolbar dispatches, body reads) without prop-drilling. Combine
`useQueryMeta` (the `/meta` descriptor) with `useSmartFilter` to build a filter bar:

```tsx
import {
  QueryProvider,
  QueryEndpointStateProvider,
  useQueryEndpointState,
  useQueryMeta,
  useSmartFilter,
} from '@granit/react-query-engine';

function PatientsScreen() {
  return (
    <QueryProvider config={{ basePath: '/api/v1/patients' }}>
      <QueryEndpointStateProvider>
        <SmartFilterBar />
        <PatientGrid />
      </QueryEndpointStateProvider>
    </QueryProvider>
  );
}

function SmartFilterBar() {
  const { data: meta } = useQueryMeta();
  const { setFilters, setSearch } = useQueryEndpointState();
  const { tokens, suggestions, phase, selectField, confirmValue, filters } = useSmartFilter({
    metadata: meta,
  });

  // Push the SmartFilter's extracted FilterEntry[] into the shared reducer.
  useEffect(() => setFilters(filters), [filters, setFilters]);
  return <>{/* render tokens + suggestion dropdown */}</>;
}
```

For non-grid lists (feeds, timelines, pickers) the package also ships standalone
pagination hooks that take a `fetcher` directly, independent of `QueryProvider`:
`usePagination` (offset, page navigation), `useInfiniteScroll` (load-more, accumulating),
and `usePagedInfiniteQuery` (a TanStack `useInfiniteQuery` wrapper for offset **or**
keyset-cursor pages).

## Public API

| Symbol                         | Kind     | Purpose                                                                 |
| ------------------------------ | -------- | ----------------------------------------------------------------------- |
| `QueryProvider`                | provider | Resolves the Axios client + base path for all query hooks below it      |
| `useQueryConfig`               | hook     | Read the resolved `ResolvedQueryConfig`; throws outside a provider      |
| `QueryEndpointStateProvider`   | provider | Lifts one query-endpoint reducer into context (shared toolbar ↔ body)   |
| `useQueryEndpointState`        | hook     | Shared `params` + dispatchers; no-op default outside the provider       |
| `useQueryEndpointStateContext` | hook     | Same, but returns `null` outside the provider                           |
| `useQueryEndpoint`             | hook     | Main data hook — `getPage` / `getGrouped` + reducer (solo or shared)    |
| `useQueryEndpointReducer`      | hook     | Pure `params` state machine + dispatchers (no network); used internally |
| `DEFAULT_QUERY_PARAMS`         | const    | `{ page: 1, pageSize: 20 }` — reducer seed default                      |
| `useQueryMeta`                 | hook     | `GET {basePath}/meta` — column/filter metadata, `staleTime: Infinity`   |
| `useSmartFilter`               | hook     | SmartFilterBar state machine: field → operator → value tokens + hints   |
| `usePagination`                | hook     | Offset pagination over a `fetcher` (page nav, abort-on-change)          |
| `useInfiniteScroll`            | hook     | Load-more pagination accumulating pages (abort-on-refetch)              |
| `usePagedInfiniteQuery`        | hook     | TanStack infinite-query wrapper for offset or keyset-cursor pages       |
| `deriveLookupScope`            | fn       | Derive a data-lookup `scope` map from active `Eq` filters (cascade)     |
| `QueryProviderProps`           | type     | `{ config, children }` for `QueryProvider`                              |
| `QueryEndpointState`           | type     | `params` + every dispatcher exposed by the shared reducer               |
| `QueryEndpointDispatchers`     | type     | The dispatcher surface (`setSearch`, `toggleSort`, `setGroupBy`, …)     |
| `UseQueryEndpoint*`            | type     | Options / return for `useQueryEndpoint` (paged + grouped query)         |
| `UseSmartFilter*`              | type     | Options / return for `useSmartFilter`                                   |
| `UsePagination*`               | type     | Options / return / `PaginationPage` for `usePagination`                 |
| `UseInfiniteScroll*`           | type     | Options / return / `InfiniteScrollPage` for `useInfiniteScroll`         |
| `UsePagedInfiniteQuery*`       | type     | Options / return / `InfinitePageResult` for `usePagedInfiniteQuery`     |

`./testing` subpath (requires the optional `msw` peer): `createQueryMetaHandler`
(MSW handler answering `GET {basePath}/meta`) and `buildEmptyQueryMeta` (an
empty-but-valid `QueryMetadata` stub with sane pagination defaults).

## Behaviour notes

- **Solo vs. shared reducer.** `useQueryEndpoint` always creates a local reducer (to
  satisfy the rules of hooks); when a `QueryEndpointStateProvider` is mounted the local
  copy is ignored and the provider's reducer wins. Without the provider, two
  `useQueryEndpoint` calls hold independent state — a toolbar writing to one will not
  move a renderer reading the other.
- **Page resets are intentional.** Every filter / search / preset / quick-filter change
  resets `page` to 1; sort and `groupBy` changes keep the current page.
- **Grouped mode.** Setting `groupBy` switches `useQueryEndpoint` from the flat paged
  query (`getPage`) to the grouped query (`getGrouped`); read `isGrouped` to pick which
  of `query` / `groupedQuery` to render.
- **Metadata is hardened.** `useSmartFilter` defensively normalizes the `/meta` payload:
  a missing, partial, or non-conforming response degrades to an empty suggestion list
  instead of throwing `metadata.filterableFields is not iterable` and tripping the route
  error boundary. Always register a `/meta` handler in tests via `createQueryMetaHandler`.
- **Lookup-backed filters.** When a filterable field declares a `lookup`,
  `useSmartFilter` stops emitting inline suggestions and surfaces
  `selectedFieldLookup` / `selectedFieldLookupMulti` / `selectedFieldLookupScope` so the
  consumer renders a `<LookupPicker>`; `confirmLookupValue` persists the opaque key(s)
  as the token value while showing the localized label.

## Out of scope

- **Rendering** — grids, SmartFilterBars, sort selectors, and pagination controls live
  in the domain feature kits that compose these hooks; this package is headless.
- **DTOs, HTTP transport, and serialization** — owned by
  [`@granit/query-engine`](../query-engine) (`getPage`, `getGrouped`, `getQueryMeta`,
  the URL serializer, validation clamps); hooks here only adapt them to React Query.
- **Saved views** — moved to [`@granit/react-entities-views`](../react-entities-views)
  (`useEntityViews`, `useCreateEntityView`, …); this package no longer owns view state.
- **Lookup data fetching** — the typeahead picker and its `useLookup` hook live in
  [`@granit/react-data-lookup`](../react-data-lookup); this package only derives the
  `scope` map and exposes the descriptor for a field.

## License

Apache-2.0
