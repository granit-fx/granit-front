# @granit/data-lookup

Framework-agnostic **data lookup** SDK — the TypeScript counterpart of the .NET
`Granit.DataLookup` module (contract: `contracts/openapi/data-lookup.json`). It
is the unified primitive that feeds typeahead pickers for both QueryEngine
filters and form dropdowns from a single `/lookups` registry.

It exposes the wire types, an axios-based HTTP client and pure scope guards
needed to drive a lookup from any client — React, React Native, a CLI, tests.
It holds **no** React, DOM or Node-only dependency. The React hooks, providers
and pickers live in [`@granit/react-data-lookup`](../react-data-lookup).

A lookup source is addressed by a `LookupDescriptor`: either a registry `name`
resolved against `/lookups/{name}`, or a custom `endpoint` URL — both return the
canonical `LookupResultResponse` shape. Sources may declare `scopeKeys` (e.g.
`tenantId`) that the caller must satisfy before any request fires.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
`@granit/api-client` as a peer (it provides the shared axios instance with the
CSRF / auth / tenant interceptors).

## Quick start

```ts
import {
  type LookupDescriptor,
  getLookupManifest,
  isScopeSatisfied,
  searchLookup,
  resolveLookup,
} from '@granit/data-lookup';
import { apiClient } from '@granit/api-client';

const options = { client: apiClient };

// 1. Discover registered sources (manifest = GET /lookups).
const { lookups } = await getLookupManifest(options);

// 2. Address a source by registry name. `scopeKeys` declares required context.
const descriptor: LookupDescriptor = { name: 'meters', scopeKeys: ['tenantId'] };
const scope = { tenantId: 'a1b2c3' };

// 3. Empty Scope Trap guard — never fire an unscoped request (400 / leak risk).
if (isScopeSatisfied(descriptor, scope)) {
  const { items, continuationToken } = await searchLookup(
    descriptor,
    { search: 'kwh', pageSize: 20, scope },
    options
  );
}

// 4. Rehydrate a saved foreign-key value into a label; null when not found (404).
const selected = await resolveLookup(descriptor, 'a1b2c3', options);
```

## Public API

| Symbol                        | Kind  | Purpose                                                  |
| ----------------------------- | ----- | -------------------------------------------------------- |
| `LookupKind`                  | type  | `'QueryEngine' \| 'Simple' \| 'ReferenceData' \| 'Enum'` |
| `LookupDescriptor`            | type  | Declarative pointer to a source (`name` xor `endpoint`)  |
| `LookupItemResponse`          | type  | One canonical item: `value`, localized `label`, `extra`  |
| `LookupResultResponse`        | type  | Paginated search response (`items`, `totalCount`, token) |
| `LookupManifestResponse`      | type  | `GET /lookups` body — the source registry                |
| `LookupManifestEntryResponse` | type  | One manifest entry (name, kind, permission, scope keys)  |
| `LookupQueryParams`           | type  | Search/page/scope params accepted by the client          |
| `LookupClientOptions`         | type  | `{ client, basePath?, signal? }` for the HTTP helpers    |
| `DEFAULT_LOOKUP_BASE_PATH`    | const | `'/lookups'` — the `MapGranitDataLookups()` route prefix |
| `getLookupManifest`           | fn    | `GET {basePath}` → source manifest                       |
| `searchLookup`                | fn    | `GET {basePath}/{name}` or `GET {endpoint}` (scoped)     |
| `resolveLookup`               | fn    | `GET .../{name}/resolve?value=` → item, `null` on 404    |
| `buildSearchQuery`            | fn    | Serialize params → axios query (scope → `scope.{key}`)   |
| `stringifyLookupValue`        | fn    | Stringify a value for a query param (objects → JSON)     |
| `findMissingScopeKey`         | fn    | First unsatisfied `scopeKey`, or `null` when complete    |
| `isScopeSatisfied`            | fn    | `true` when the descriptor is ready to emit a request    |
| `DataLookupPermissions`       | const | Permission keys (`DataLookup.Lookups.Read`)              |

## Out of scope / caveats

- **Empty Scope Trap.** A scoped source (e.g. `meters` scoped by `tenantId`)
  mounted on a blank form whose parent field is unset must NOT fire an unscoped
  request — the backend returns 400, and bypassing the guard risks a
  cross-tenant leak. Gate every call with `isScopeSatisfied` / `findMissingScopeKey`;
  the React layer wires this into `useLookup` automatically.
- **`searchParam` is not universal.** A custom `descriptor.searchParam` name is
  honored only for `Simple` registry sources and bespoke custom `endpoint`s.
  `QueryEngine` / `ReferenceData` / `Enum` registry sources always bind `search`,
  so `buildSearchQuery` forces `search` for them rather than forward a key the
  backend would silently ignore.
- **Labels are pre-localized.** `LookupItemResponse.label` is already localized
  server-side in the caller's `Accept-Language` culture — render it verbatim, do
  not re-translate.
- **Permission checks are server-authoritative.** `requiredPermission` /
  `DataLookupPermissions` let the UI hide a picker the user cannot open; the
  backend re-checks `DataLookup.Lookups.Read` on every endpoint. Treat the
  client-side check as a UX hint, never a security boundary.
- **No React, no hooks, no query keys.** React Query hooks (`useLookup`,
  `useLookupResolve`, `useLookupManifest`), providers and the picker components
  live in [`@granit/react-data-lookup`](../react-data-lookup), per the
  core ↔ react-layer split.
