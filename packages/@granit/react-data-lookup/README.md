# @granit/react-data-lookup

React hooks + headless components for the Granit **data-lookup** module —
typeahead search, value rehydration, and source discovery for registry-backed
reference pickers (tenants, countries, foreign-key references, …). This is the
**React hooks/components layer**: it wraps the framework-agnostic Axios calls and
DTOs from [`@granit/data-lookup`](../data-lookup) in TanStack Query hooks and
unstyled, render-prop components, with a shared `DataLookupProvider` for
client/base-path/culture configuration.

The split is two packages over the same .NET `Granit.DataLookup` backend
(contract: `contracts/openapi/data-lookup.json`); there is no `react-ui` admin
feature kit:

- [`@granit/data-lookup`](../data-lookup) — framework-agnostic core: DTOs + Axios
  functions (`searchLookup`, `resolveLookup`, `getLookupManifest`,
  `findMissingScopeKey`, …) and `DataLookupPermissions`.
- `@granit/react-data-lookup` (this package) — React Query hooks, the provider,
  and three headless components (`LookupSelect`, `LookupPicker`, `LookupBadge`).

Every component is **headless render-prop**: this package owns the data,
keyboard, and ARIA plumbing; the host app brings its own UI kit (Radix,
HeadlessUI, shadcn, custom CSS). It holds no styling of its own.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/data-lookup` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback
  for the Axios client when `config.client` is omitted.
- `@granit/react-query-engine` — `usePagedInfiniteQuery`, the offset/keyset
  infinite-scroll engine `useLookup` builds on.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-data-lookup/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and UI culture),
then drive a picker with one of the headless components or call the hooks
directly.

```tsx
import { DataLookupProvider, LookupSelect } from '@granit/react-data-lookup';
import { useGranitClient } from '@granit/react-api-client';
import type { LookupDescriptor } from '@granit/data-lookup';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <DataLookupProvider config={{ client: useGranitClient(), culture: 'fr-CA' }}>
      {children}
    </DataLookupProvider>
  );
}

// A descriptor that declares no scope keys — always enabled.
const tenants: LookupDescriptor = { name: 'tenants', scopeKeys: [] };

function TenantField({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  return (
    <LookupSelect
      descriptor={tenants}
      value={value}
      onChange={onChange}
      render={({ search, setSearch, items, missingScopeKey, onInputKeyDown }) =>
        missingScopeKey ? (
          <span>Select a {missingScopeKey} first.</span>
        ) : (
          <div role="combobox">
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={onInputKeyDown} />
            <ul role="listbox">
              {items.map((item) => (
                <li key={String(item.value)} onClick={() => onChange(item.value)}>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )
      }
    />
  );
}
```

The render args also carry `sentinelRef` (attach to an end-of-list element for
infinite scroll), `selectedItem` (the resolved label of the current value), and
the full WAI-ARIA combobox plumbing (`activeDescendant`, `getOptionId`,
`listboxId`). For a SmartFilterBar-style multi-select use `<LookupPicker multi>`;
for a read-only label projection use `<LookupBadge>`.

Hooks can also be used standalone. `useLookup` returns an infinite-scroll search
result and transparently handles both server pagination modes (offset and
continuation-token/keyset); it enforces the **Empty Scope Trap** — when the
descriptor declares `scopeKeys` and a value is missing, no request is issued and
`missingScopeKey` names the unfilled parent field:

```tsx
import { useLookup, useLookupManifest } from '@granit/react-data-lookup';

function CityField({ tenantId }: { tenantId: string | null }) {
  // `cities` is scoped by tenant — the query stays idle until tenantId is set.
  const { items, missingScopeKey, fetchNextPage, hasNextPage } = useLookup(
    { name: 'cities', scopeKeys: ['tenantId'] },
    { search: '', scope: { tenantId } }
  );

  if (missingScopeKey) return <span>Pick a {missingScopeKey} first.</span>;
  return (
    <ul>
      {items.map((c) => <li key={String(c.value)}>{c.label}</li>)}
      {hasNextPage && <button onClick={() => fetchNextPage()}>More</button>}
    </ul>
  );
}

// Discovery: list registered sources, optionally gated by a permission predicate.
function SourcePicker({ can }: { can: (p: string) => boolean }) {
  const { accessibleLookups, canUse } = useLookupManifest({ hasPermission: can });
  return <ul>{accessibleLookups.map((s) => <li key={s.name}>{s.name}</li>)}</ul>;
}
```

## Public API

| Symbol                                  | Kind      | Purpose                                                        |
| --------------------------------------- | --------- | -------------------------------------------------------------- |
| `DataLookupProvider`                    | provider  | Supplies Axios client, base path, and UI culture to all hooks  |
| `useDataLookupConfig`                   | hook      | Read the resolved config; throws outside a provider            |
| `useOptionalDataLookupConfig`           | hook      | Read the resolved config or `null` if no provider              |
| `useLookup`                             | hook      | Infinite-scroll typeahead search + Empty Scope Trap gate       |
| `useLookupResolve`                      | hook      | Rehydrate one value to a `LookupItemResponse` (`.../resolve`)  |
| `useLookupManifest`                     | hook      | Source discovery (`GET /lookups`) + permission-gated views     |
| `useDebouncedValue`                     | hook      | Generic debounce helper (used for the search term)             |
| `useIntersectionSentinel`               | hook      | Callback ref firing `onIntersect` for infinite-scroll lists    |
| `useListboxNavigation`                  | hook      | Headless WAI-ARIA combobox keyboard + activedescendant wiring  |
| `LookupSelect`                          | component | Headless single-select combobox (search + resolve + ARIA)      |
| `LookupPicker`                          | component | SmartFilterBar variant; multi-select for the `In` operator     |
| `LookupBadge`                           | component | Read-only label projection of a stored value (detail/audit)    |
| `buildLookupQueryKey`                   | fn        | Query-key factory for a search (search/pageSize/scope/culture) |
| `buildLookupResolveQueryKey`            | fn        | Query-key factory for a resolve invocation                     |
| `buildLookupManifestQueryKey`           | fn        | Query-key factory for the discovery manifest                   |
| `DataLookupConfig`                      | type      | Provider input (optional client / basePath / culture)          |
| `ResolvedDataLookupConfig`              | type      | Provider output with resolved required client + basePath       |
| `DataLookupProviderProps`               | type      | `{ config?, children }`                                        |
| `UseLookupParams`                       | type      | Search inputs (`search`, `scope`, `pageSize`)                  |
| `UseLookupOptions`                      | type      | Infra/behaviour options (client, basePath, culture, debounce)  |
| `UseLookupResult`                       | type      | `useLookup` return (items + paging + `missingScopeKey`)        |
| `UseLookupResolveOptions`               | type      | Per-call options for `useLookupResolve`                        |
| `UseLookupManifestOptions`              | type      | `useLookupManifest` options (incl. `hasPermission` predicate)  |
| `UseLookupManifestResult`               | type      | Manifest query + `accessibleLookups` / `canUse` / `getEntry`   |
| `UseIntersectionSentinelOptions`        | type      | `{ enabled, onIntersect, rootMargin? }`                        |
| `ListboxNavigation`                     | type      | State + ARIA wiring returned by `useListboxNavigation`         |
| `UseListboxNavigationOptions`           | type      | `{ optionCount, onSelect, onEscape? }`                         |
| `Lookup{Select,Picker,Badge}Props`      | type      | Props for the three components                                 |
| `Lookup{Select,Picker,Badge}RenderArgs` | type      | Render-prop argument shapes for the three components           |

`./testing` subpath (requires the optional `msw` peer): `createLookupHandlers`
(MSW handlers for the three `/lookups/*` endpoints, default base `/lookups`,
`mode: 'offset' | 'cursor'`) plus the `mockCountries`, `mockLookupSources`, and
`mockLookupManifest` fixtures, and the `CreateLookupHandlersOptions` /
`LookupSourceMap` types.

## Empty Scope Trap

A scoped lookup (descriptor with non-empty `scopeKeys`, e.g. `cities` keyed by
`tenantId`) must not fire until its parent field is filled. `useLookup` calls
`findMissingScopeKey` from the core package and forces `enabled: false` while any
declared key is missing from `scope` — **no HTTP request is issued** — surfacing
the first unfilled key as `missingScopeKey`. The components forward this so the UI
can render a placeholder ("Pick a tenant first") instead of an empty open picker.
Pass `options.enabled` to additionally suppress the query, never to bypass the
gate.

## Caveats

- **Permission filtering is a UX hint, not a boundary.** `useLookupManifest`'s
  `hasPermission` predicate and the derived `accessibleLookups` / `canUse` only
  hide pickers the user cannot use, avoiding a noisy 403. The backend
  (`Granit.DataLookup`, `DataLookupPermissions`) still re-checks authorization on
  every search/resolve/manifest call — never treat a client-side `canUse` as
  enforcement.
- **Culture segments the cache.** `culture` is part of every search/resolve query
  key, so switching language invalidates previously fetched labels rather than
  showing stale translations. Set it once on the provider (or per call).
- **`useLookupResolve` returns `null`, it does not throw on a miss.** An
  unresolvable value (404) yields `data: null`; `LookupBadge` falls back to the
  raw value (or a caller `fallback`) so detail views never blank out.
- **`useIntersectionSentinel` degrades gracefully.** When `IntersectionObserver`
  is unavailable (SSR / jsdom) the observer is simply not attached; wire an
  explicit "load more" control if you need paging in those environments.

## Out of scope

- **DTOs and HTTP transport** — owned by [`@granit/data-lookup`](../data-lookup)
  (mirror of `Granit.DataLookup`); hooks here only adapt them to React Query.
- **Styling and component markup** — every component is render-prop; the host app
  supplies the combobox/badge UI. There is no `react-ui-data-lookup` kit.
- **Authentication and the Axios client** — issuing/refreshing tokens and the
  CSRF/auth/tenant interceptors are `@granit/api-client` and the BFF; this
  package consumes the already-authenticated client.
- **Defining lookup sources** — the registry, source kinds, and required
  permissions are declared server-side; the front discovers them via the
  manifest.

## License

Apache-2.0
