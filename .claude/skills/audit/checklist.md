# Audit Checklist — Granit Front Packages

Work through each category **in order**. For each check, compare the frontend
package against the backend .NET module. Use MCP tools (`granit-tools`,
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
      `Get*` → `get*`, `List*` → `list*`, `Create*` → `create*`,
      `Update*` → `update*`, `Delete*` → `delete*` (consistent across all
      packages). **NEVER `fetch*`** — reads are `get*` (single) / `list*`
      (collection). Flag any `fetch*` API function as INCONSISTENCY.
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

- [ ] **Single barrel (source-direct)**: `src/index.ts` is the only entry point
      for source-direct packages. **Exception**: published packages
      (`@granit/csp`, `@granit/arch-tests-kit`) and any package exposing a
      `<pkg>/csp` Trusted-Types subpath ship additional documented `exports` —
      these are intentional, verify them against `package.json`, do not flag as leaks
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
If roslyn-lens is unavailable, use `mcp__granit-tools__code_search` with the
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
- [ ] **No contract drift** (freshness — re-verify, don't assume): for each
      covered endpoint, re-check against the CURRENT backend source
      (`~/dev/granit-fx/granit-dotnet` for framework modules,
      `~/dev/granit-fx/granit-business` for business modules) that the route
      template, HTTP method, and request/response DTO STILL match. A function
      that compiled months ago drifts silently when the backend renames a route,
      changes a verb, or adds a required field. Flag any drift as BREAKING
- [ ] **Saved views**: if the module uses `MapQueryEndpoints`, saved view CRUD
      functions exist
- [ ] **Meta endpoint**: if the module exposes `/meta`, a `get*Meta` function
      exists
- [ ] **Route consistency**: dynamic segments use the same parameter names
      as the .NET route template (e.g., `{id}` not `{entityId}` if .NET uses `{id}`)

### 2c. Serialization

- [ ] **Query string format**: matches what the backend `[FromQuery]` or custom
      binder expects (e.g., `filter[field.op]=value`, not `filter.field.op=value`)
- [ ] **Boolean serialization**: `true`/`false` strings (not `1`/`0`)
- [ ] **Array serialization**: comma-separated (e.g., `quickFilters=A,B`)
- [ ] **Date serialization**: ISO 8601 format

### 2d. HTTP client conformity (CLAUDE.md)

- [ ] **Axios for domain calls**: every business/domain HTTP call goes through
      the centralized `@granit/api-client` Axios instance (to inherit CSRF, auth,
      and tenant interceptors) — NOT native `fetch`
- [ ] **`fetch` only below the client**: native `fetch` is allowed ONLY in infra
      layers that sit below the Axios client — `@granit/bff` (session/CSRF
      bootstrap), `@granit/react-bff`, telemetry transports (`@granit/logger-otlp`,
      `@granit/react-tracing`), and Fetch-contract adapters
      (`@granit/notifications-sse`). Any new `fetch()` for a domain endpoint is
      BREAKING — route it through Axios (streaming via `adapter: 'fetch'` +
      `responseType: 'stream'`)

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
- [ ] **No forbidden structure mixes** (CLAUDE.md): a core `@granit/{module}`
      has NO `hooks/` dir; a `react-{module}` has NO `api/` dir (its hooks live
      in `hooks/`); NO `types.ts` flat file at `src/` root (always
      `types/index.ts`, even for ≤3 types); NO `endpoints/` dir (DTOs go in
      `types/`). `query-keys.ts` lives in the react package's `hooks/`, never in
      the core package
- [ ] **Naming conventions**: functions follow `get*` / `list*` (reads),
      `create*`, `update*`, `delete*` pattern; hooks follow `use*` pattern
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

- [ ] **showcase-admin-react imports** (primary consumer): check
      `grep -r "@granit/{package}" ~/dev/granit-fx/granit-showcase-react/src/`
      for any usage that would break with proposed changes
- [ ] **cms-renderer imports**: same check on
      `~/dev/granit-fx/granit-cms-renderer/{app,src}/`
- [ ] **guava-front imports** (downstream app, if present): same check on
      `~/dev/digital-dynamics/guava-platform/applications/guava-front/src/`
- [ ] **No breaking exports**: if an exported symbol is renamed/removed,
      consumers must be updated in the same PR

### 5d. Runtime conformity (arch-tests territory)

Before flagging these by hand, check whether `@granit/arch-tests` already covers
the rule — extend the arch-test rather than duplicating an ad-hoc check.

- [ ] **Logging façade**: runtime code uses `@granit/logger` (`createLogger`),
      never `console.*`
- [ ] **CSP / Trusted Types**: any package that writes to a DOM script sink
      (`.innerHTML`, `.outerHTML`, `.insertAdjacentHTML`, direct `.src =` or
      `setAttribute('src', …)` on `iframe`/`script`) MUST expose a `<pkg>/csp`
      subpath with an idempotent `installPolicy()`. Verify with `pnpm check:csp`;
      a new sink without a `/csp` export is BREAKING
- [ ] **`'use client'` boundaries**: in `react-*` packages consumed by RSC apps
      (e.g. the CMS renderer), components using hooks/browser APIs carry the
      `'use client'` directive; server-only entries stay free of client code

---

## 6. Module Decomposition & Backend Alignment (--scope all)

The frontend package graph must mirror the .NET backend's bounded-context slicing.
The backend slices every module the same way — framework modules in
`~/dev/granit-fx/granit-dotnet`, business/domain modules in
`~/dev/granit-fx/granit-business`:

```text
Granit.{Module}                     → core abstractions / types
Granit.{Module}.Endpoints           → HTTP contract   ← the frontend mirrors THIS
Granit.{Module}.EntityFrameworkCore → persistence     (no frontend equivalent)
Granit.{Module}.BackgroundJobs/.Notifications → out of frontend scope
Granit.{Parent}.{Child}             → sub-module (e.g. Authentication.ApiKeys)
```

### 6a. Bounded-context mapping

- [ ] **One backend context = one frontend package pair**: each `Granit.{Module}`
      that ships a `.Endpoints` project maps to `@granit/{module}` (+
      `react-{module}`). A frontend package bundling two unrelated backend
      contexts is an INCONSISTENCY
- [ ] **Sub-modules stay split**: backend sub-modules map to sub-packages at the
      SAME granularity, never merged into the parent — e.g.
      `Granit.Authentication.ApiKeys` → `@granit/authentication-api-keys`,
      notification transports → `@granit/notifications-{signalr,sse,…}`, CMS
      domains → `@granit/cms-{seo,redirects,hostnames}`
- [ ] **Endpoints sourced from `.Endpoints`**: a domain's `src/api/` functions
      mirror the routes of that module's `.Endpoints` project — in `granit-dotnet`
      for framework modules, in `granit-business` for business modules (Parties,
      Documents, Invoicing, Taxonomy, Workspaces, Dashboards, …)
- [ ] **No persistence/jobs leakage**: nothing in the frontend mirrors
      `.EntityFrameworkCore`, `.BackgroundJobs`, or `.Notifications` internals —
      only the `.Endpoints` HTTP contract is a frontend concern

### 6b. Cross-domain integration (glue packages)

- [ ] **Glue, don't merge**: integration spanning two domains lives in a
      dedicated glue package, NEVER inside an upstream infra/domain package
      (e.g. `@granit/entity-merge` is generic; dedup is a separate package). The
      dependency points glue → domains, never domain → glue — arch-test the
      inverse edge
- [ ] **Layering matches the backend seam**: where the backend splits a concern
      across layers (framework vs business vs endpoints), the frontend split
      follows the same seam (generic mechanism in `@granit/{module}`, domain
      wiring in a glue package or the consuming app)

---

## Suppressions — DO NOT flag

- Style-only issues (formatting, import order) — linter handles this
- Missing JSDoc on internal functions — only flag on public API
- "Could be more generic" — don't suggest abstractions without 3+ duplicates
- Test file organization (naming, folder structure)
- `pnpm-lock.yaml` changes
- Packages that are explicitly marked as placeholders/skeletons
