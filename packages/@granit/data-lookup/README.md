# @granit/data-lookup

Framework-agnostic TypeScript types and an axios-based HTTP client for **Granit
Data Lookup** — the unified primitive that feeds typeahead pickers for both
QueryEngine filters and form dropdowns.

## Contents

- `LookupDescriptor`, `LookupKind`, `LookupItem`, `LookupResult`, `LookupManifest`,
  `LookupQueryParams` — wire types mirroring the backend contract.
- `searchLookup`, `resolveLookup`, `fetchLookupManifest` — `axios` helpers for the
  `/api/granit/lookups` endpoints.
- `findMissingScopeKey`, `isScopeSatisfied` — Empty Scope Trap guards shared with
  the React hook layer.

For React hooks and components, depend on `@granit/react-data-lookup`.

See the backend documentation at
`/dotnet/business/data-lookup/` for the full contract.
