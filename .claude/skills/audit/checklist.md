# Audit Checklist — Granit Front Packages

Work through each category **in order**. For each check, compare the frontend
package against the backend .NET module. Use MCP tools (`granit-docs`,
`roslyn-lens`) to retrieve backend contracts efficiently.

---

## 1. Type Conformity (--scope types)

### 1a. Request/Response DTOs

**Module-level naming** (check once per package):

- [ ] **Package ↔ namespace**: `@granit/{kebab-name}` maps to `Granit.{PascalName}`
      (e.g., `@granit/query-engine` → `Granit.QueryEngine`,
      `@granit/blob-storage` → `Granit.BlobStorage`,
      `@granit/audit-log` → `Granit.AuditLog`)
- [ ] **API function verb mapping**: frontend functions follow the convention
      `Get*` → `fetch*`, `Create*` → `create*`, `Update*` → `update*`,
      `Delete*` → `delete*`, `List*` → `fetch*` (consistent across all packages)
- [ ] **Route segment alignment**: URL path segments built in frontend API
      functions match the .NET route templates exactly (same resource names,
      same nesting)

For each type exported from the package's `src/types/`:

- [ ] **Name alignment**: type name matches the .NET DTO name
      (e.g., `QueryRequest` not `QueryParams`, `PagedResult` not `PaginatedResponse`)
- [ ] **Field completeness**: every field in the .NET DTO has a corresponding
      field in the TypeScript interface (check for missing optional fields)
- [ ] **Field naming**: camelCase in TS matches the JSON serialization of the
      .NET property (PascalCase → camelCase via `JsonSerializerOptions`)
- [ ] **Field types**: correct TypeScript equivalent for each .NET type
      (`Guid` → `string`, `DateTime` → `string`, `int?` → `number | null`,
      `IReadOnlyList<T>` → `readonly T[]`, enums → string union or const object)
- [ ] **Nullability**: nullable .NET properties are `| null` or `| undefined`
      in TS, non-nullable are required
- [ ] **Enum values**: string enum values match exactly (case-sensitive)
- [ ] **Readonly markers**: response types use `readonly` on all fields

### 1b. Shared base types

- [ ] **PaginationParams**: used (not duplicated inline) in all paginated APIs
- [ ] **PagedResult**: used (not `PaginatedResponse` or custom shapes) for all
      paginated responses
- [ ] **ProblemDetails**: error responses typed as `ProblemDetails` from
      `@granit/api-client`

### 1c. Export surface

- [ ] **Single barrel**: `src/index.ts` is the only entry point
- [ ] **No internal leaks**: types not meant for consumers are not exported
- [ ] **`import type`**: type-only imports use `import type` syntax
- [ ] **Re-exports**: if a type is used across packages, it's re-exported from
      the owning package (not imported directly from `@granit/query-engine` in hooks)

---

## 2. API Functions (--scope api)

### 2a. Function signatures

For each function in `src/api/`:

- [ ] **Parameter order**: `(client: AxiosInstance, basePath: string, ...params)`
- [ ] **Return type**: explicit `Promise<T>` with correct response type
- [ ] **HTTP method**: matches the backend endpoint
      (`GET` for reads, `POST` for creates, `PUT` for full updates,
      `PATCH` for partial, `DELETE` for removals)
- [ ] **URL construction**: path segments properly encoded with
      `encodeURIComponent` for dynamic segments
- [ ] **Query params**: sent via `{ params }` config (not concatenated in URL)
      for simple params; serialized with dedicated function for complex params

### 2b. Endpoint coverage

**Systematic discovery** — build a complete backend endpoint inventory before
checking coverage. Use `mcp__roslyn-lens__find_symbol` to locate the
`Map{Module}Endpoints` method, then `mcp__roslyn-lens__analyze_method` or
`mcp__roslyn-lens__get_symbol_detail` to extract every route registration.
If roslyn-lens is unavailable, use `mcp__granit-docs__search_code` with the
module name, then read the endpoint file directly.

Build the inventory as:

```text
[HTTP method] [route template] → [handler] → [request DTO] → [response DTO]
```

Then check each entry against the frontend `src/api/` functions:

- [ ] **All backend endpoints covered**: each route in the inventory has a
      corresponding frontend API function (produce the Endpoint Alignment
      table from the report template)
- [ ] **No orphan functions**: every frontend API function maps to a real
      backend endpoint (flag stale functions targeting removed endpoints)
- [ ] **Saved views**: if the module uses `MapQueryEndpoints`, saved view CRUD
      functions exist
- [ ] **Meta endpoint**: if the module exposes `/meta`, a `fetch*Meta` function
      exists
- [ ] **Route consistency**: dynamic segments use the same parameter names
      as the .NET route template (e.g., `{id}` not `{entityId}` if .NET uses `{id}`)

### 2c. Serialization

- [ ] **Query string format**: matches what the backend `[FromQuery]` or custom
      binder expects (e.g., `filter[field.op]=value`, not `filter.field.op=value`)
- [ ] **Boolean serialization**: `true`/`false` strings (not `1`/`0`)
- [ ] **Array serialization**: comma-separated (e.g., `quickFilters=A,B`)
- [ ] **Date serialization**: ISO 8601 format

---

## 3. React Hooks (--scope hooks)

### 3a. Provider pattern

- [ ] **Context provider**: `{Module}Provider` component exists with config prop
- [ ] **useConfig hook**: `use{Module}Config()` hook throws if used outside
      provider
- [ ] **Config type**: includes `client: AxiosInstance` and `basePath: string`
      at minimum

### 3b. Query hooks

- [ ] **TanStack Query**: all data fetching uses `useQuery` / `useMutation`
- [ ] **Query keys**: use a factory function (`buildQueryKey` or module-specific
      key builder) — no inline string arrays
- [ ] **Stale time**: read-heavy data has appropriate `staleTime`
      (metadata: `Infinity`, lists: default, real-time: `0`)
- [ ] **Error handling**: errors propagate via TanStack Query's `error` state
      (not try/catch swallowing)
- [ ] **Enabled flag**: conditional queries use `enabled` option
- [ ] **Pagination**: uses `usePagination` or `useInfiniteScroll` from
      `@granit/react-query-engine` — not a custom implementation
- [ ] **Optimistic updates**: mutations that affect cached lists invalidate
      the relevant query keys in `onSuccess`

### 3c. Hook API design

- [ ] **Return shape**: consistent with other `@granit/react-*` packages
      (query result + dispatchers + computed state)
- [ ] **Memoization**: callbacks wrapped in `useCallback`, computed values in
      `useMemo`
- [ ] **No side effects at import**: hooks and providers don't execute code
      at module level

---

## 4. Dependencies (--scope deps)

### 4a. package.json

- [ ] **Peer deps declared**: React, axios, @tanstack/react-query listed as
      `peerDependencies` (not `dependencies`)
- [ ] **Core package as peer dep**: `react-*` package lists its core `@granit/*`
      counterpart as peer dep
- [ ] **No phantom deps**: every imported package is listed in either `peerDependencies`
      or `devDependencies`
- [ ] **Version ranges**: peer deps use `^` or `*` ranges, not pinned versions
- [ ] **No duplicate deps**: a dependency is not in both `peerDependencies`
      and `dependencies`

### 4b. CLAUDE.md sync

- [ ] **Peer dep matrix**: the `peerDependencies` listed in CLAUDE.md match
      the actual `package.json` of each package
- [ ] **Package table**: new packages are listed in the CLAUDE.md package table

### 4c. THIRD-PARTY-NOTICES

- [ ] **All deps listed**: every external dependency has an entry in
      `THIRD-PARTY-NOTICES.md`
- [ ] **License check**: no GPL/LGPL/AGPL/SSPL dependencies

---

## 5. Cross-Cutting Concerns

### 5a. Pattern uniformity

- [ ] **Directory structure**: `src/types/`, `src/api/`, `src/hooks/`,
      `src/providers/`, `src/__tests__/` — consistent across all packages
- [ ] **Naming conventions**: functions follow `fetch*`, `create*`, `update*`,
      `delete*` pattern; hooks follow `use*` pattern
- [ ] **Error types**: API errors are `AxiosError<ProblemDetails>` everywhere
- [ ] **Config pattern**: all `react-*` packages use Provider + useConfig
      (not module-level singletons)

### 5b. Test coverage

- [ ] **API functions tested**: each `src/api/*.ts` file has a corresponding
      test file
- [ ] **Mock client**: tests use `createMockClient()` from `@granit/testing`
- [ ] **Response shape**: mock responses in tests match `PagedResult<T>` or
      the actual backend response shape (not outdated `PaginatedResponse`)
- [ ] **Coverage >= 80%**: on all source files

### 5c. Consumer compatibility

- [ ] **guava-front imports**: check `grep -r "@granit/{package}" ~/dev/digital-dynamics/guava-platform/applications/guava-front/src/`
      for any usage that would break with proposed changes
- [ ] **guava-admin imports**: same check on guava-admin
- [ ] **No breaking exports**: if an exported symbol is renamed/removed,
      consumers must be updated in the same PR

---

## Suppressions — DO NOT flag

- Style-only issues (formatting, import order) — linter handles this
- Missing JSDoc on internal functions — only flag on public API
- "Could be more generic" — don't suggest abstractions without 3+ duplicates
- Test file organization (naming, folder structure)
- `pnpm-lock.yaml` changes
- Packages that are explicitly marked as placeholders/skeletons
