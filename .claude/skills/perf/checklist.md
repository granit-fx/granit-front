# Scale Readiness Checklist — Granit Front Packages

Work through each category **in order**. Every box that fails MUST be reported
with the **scale scenario** that makes it matter (a concrete number: rows,
requests/s, KB). A box with no plausible high-scale trigger is not a finding.

References to framework primitives below are real and verified:
`@granit/query-engine` ships `validateQueryRequest` (clamps page/pageSize),
`nextCursor` cursor support, and `usePagination` / `useInfiniteScroll`;
`@tanstack/react-virtual` is in the approved dependency set.

---

## 1. Data Fetching at Scale (--scope data)

### 1a. Request cancellation

- [ ] **Signal accepted**: every `src/api/` function accepts an optional
      `signal?: AbortSignal` and forwards it to axios as `{ signal }`. Without
      it, superseded requests (fast filter/page changes) keep running and race
      on cache write. _Scale: any fast-changing query — search-as-you-type,
      paginated tables._
- [ ] **Signal wired from the hook**: query hooks pass the `signal` from the
      TanStack Query `queryFn` context (`queryFn: ({ signal }) => getX(client, …, signal)`)
- [ ] **Cleanup on unmount**: ad-hoc effects that fetch (outside TanStack Query)
      abort via `AbortController` in their cleanup

### 1b. Pagination strategy

- [ ] **Cursor for unbounded sets**: high-cardinality or append-only lists
      (audit logs, notifications, activity feeds, search) use **cursor**
      pagination (`nextCursor`), not offset/`skip` — offset cost grows with page
      depth on the server
- [ ] **Clamped params**: paginated requests go through `validateQueryRequest` /
      `serializeQueryRequest`; no hand-built `{ page, pageSize }` that can request
      an unbounded page size
- [ ] **`placeholderData` / `keepPreviousData`**: paginated/infinite UIs keep the
      previous page visible while fetching the next (no spinner-flash storm)
- [ ] **Bounded accumulation**: infinite scroll caps the in-memory window (drops
      or virtualizes off-screen pages) — it does not grow an unbounded array in
      memory

### 1c. Request fan-out

- [ ] **No client-side N+1**: no `await` inside a `for`/`map` over a collection,
      and no per-row fetch. Use a batch endpoint or a single query.
      _Scale: a 200-row list issuing 200 requests._
- [ ] **Deduplicated**: the same logical resource is not fetched by multiple
      uncoordinated hooks with different keys (TanStack dedups identical keys —
      keep keys identical for shared data)
- [ ] **Parallel where independent**: independent requests use `Promise.all`,
      not sequential `await`s

---

## 2. Rendering at Scale (--scope render)

### 2a. Virtualization

- [ ] **Large lists virtualize**: any list / table / gallery that can render a
      large or infinite-scroll dataset uses `@tanstack/react-virtual`
      (`useVirtualizer`) — NOT a raw `items.map()` over the whole array.
      _Scale: DOM nodes ∝ dataset; freezes in the low thousands of rows._
- [ ] **Fixed vs dynamic measurement**: virtualizer uses `estimateSize` /
      `measureElement` appropriately for variable-height rows
- [ ] **No off-screen heavy work**: rows don't mount heavy widgets (charts,
      editors) for off-screen items

### 2b. Input responsiveness

- [ ] **Debounced inputs**: search / filter / autocomplete inputs debounce (or
      throttle) before firing a query — never one request per keystroke.
      _Scale: ~8 requests per typed word without it._
- [ ] **Deferred values**: expensive derived UI off a fast-changing input uses
      `useDeferredValue` / `startTransition` to keep typing responsive

### 2c. Re-render discipline

- [ ] **Stable keys**: list item `key` is a stable ID, never the array index
      (index keys break reconciliation on reorder/insert)
- [ ] **Memoized row handlers**: per-row callbacks are `useCallback` (or hoisted),
      not new closures each render that re-render every row
- [ ] **No inline object/array props** on hot list items (new reference each
      render defeats `memo`)
- [ ] **Derived data memoized**: filtering/sorting/grouping of large arrays is in
      `useMemo`, not recomputed every render
- [ ] **`select` to narrow**: query hooks use `select` so a component re-renders
      only when its slice changes, not on any cache write

---

## 3. Cache & State at Scale (--scope cache)

- [ ] **`staleTime` on hot/metadata data**: reference data, schemas, permissions
      set a meaningful `staleTime` (often `Infinity` for static metadata) to avoid
      refetch storms across many mounted components
- [ ] **`gcTime` tuned**: long lists / heavy responses don't linger in cache
      unbounded; inactive heavy queries are garbage-collected
- [ ] **Scoped invalidation**: mutations invalidate the **specific** affected
      query keys in `onSuccess` — never argument-less `invalidateQueries()`,
      which refetches everything. _Scale: one write triggering dozens of refetches._
- [ ] **Optimistic over refetch**: list mutations update the cache optimistically
      instead of refetching the whole list
- [ ] **`structuralSharing` preserved**: large responses rely on TanStack's
      structural sharing (don't deep-clone responses, which breaks referential
      stability and forces re-renders)
- [ ] **No large server data in component state**: big datasets live in the query
      cache, not copied into `useState` (double memory + stale copies)

---

## 4. Bundle & Load at Scale (--scope bundle)

- [ ] **`"sideEffects": false`**: every package without module-level side effects
      declares it (or a precise file list) so consuming-app bundlers tree-shake
      unused barrel exports. _Scale: 146 barrels; missing flag = dead code shipped._
- [ ] **No eager heavy imports**: heavy/optional UI (rich text / Puck editors,
      charting, PDF, map, code highlighters) is `lazy()` / dynamic `import()`,
      not statically imported into a barrel that every consumer pulls
- [ ] **Barrel hygiene**: `src/index.ts` does not eagerly re-export an optional
      heavy submodule that drags its deps into every importer — expose it on a
      subpath instead
- [ ] **Peer, not bundled**: React, axios, `@tanstack/*` are `peerDependencies`
      so they are not duplicated across packages in the final bundle
- [ ] **No duplicate heavy deps**: two packages don't pull different major
      versions of the same heavy library into one app

---

## 5. Real-time & Background at Scale (--scope realtime)

- [ ] **Reconnect with backoff**: SSE / SignalR transports reconnect with
      exponential backoff (verified present in `notifications-sse` /
      `notifications-signalr` — keep it when extending)
- [ ] **Shared connection**: one transport connection per client, shared via
      provider/context — NOT one connection per subscribing component.
      _Scale: 50 widgets = 50 sockets without sharing._
- [ ] **Event coalescing / backpressure**: high-frequency streams batch or
      coalesce updates before touching the query cache (no re-render per event)
- [ ] **Subscription cleanup**: every subscription / `addEventListener` /
      `setInterval` is torn down on unmount (no leaks accumulating over a long
      session)
- [ ] **Polling is paused when hidden**: polling intervals use a sane period and
      pause when the tab is backgrounded (`refetchIntervalInBackground: false`
      or visibility-aware)

---

## 6. Concurrency & Resilience (cross-cutting)

- [ ] **Timeouts**: long-running calls set a timeout so a slow backend doesn't
      pin a connection indefinitely
- [ ] **Bounded retries**: TanStack `retry` is bounded with backoff; no infinite
      retry loop hammering a failing endpoint
- [ ] **Race-safe writes**: concurrent mutations to the same entity reconcile via
      the cache (last-write-wins is explicit, not accidental)
- [ ] **No unbounded growth**: nothing accumulates without bound over a long
      session — caches, event buffers, in-memory lists all have a ceiling

---

## Suppressions — DO NOT flag

- Micro-optimizations with no measurable effect at realistic scale
- Virtualization for lists with a small fixed cap (read the cap first)
- Memoization of trivially cheap computations (memo overhead > the work)
- "Could be lazy-loaded" for small always-used modules
- `staleTime` tuning on data that is genuinely real-time (must be fresh)
- Anything already owned by `/audit` (conformity) or `/quality` (lint, tests) —
  cross-reference, don't duplicate
- Backend-side performance (query plans, indexes, N+1 in EF Core) — that is the
  .NET repo's concern, not this front-end audit
