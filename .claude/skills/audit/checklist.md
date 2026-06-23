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
- [ ] **Coverage >= 80%**: on all source files (all four metrics — lines,
      statements, functions, branches — the global Vitest threshold)

### 5e. Test data & mocks (no duplication)

The headless `@granit/react-{module}` package owns the **shared test fixtures**
for its domain. Tests in that package AND in its `@granit/react-ui-{module}`
consumer (and any other consumer) must reuse them — never re-create the same
domain DTO inline.

- [ ] **Shared mocks exist (every module)**: the headless `@granit/react-{module}`
      ships `src/testing/` with `data.ts` (typed `mock*` / `sample*` fixtures) and,
      where the module has HTTP endpoints, `handlers.ts` (MSW), re-exported via a
      `src/testing/index.ts` barrel and the `<pkg>/testing` subpath. A module with
      API endpoints but no `/testing` fixtures is a GAP
      (`Action: add @granit/react-{module}/testing fixtures + MSW handlers`)
- [ ] **Vitest alias registered**: every `/testing` barrel has a matching alias in
      `vitest.config.ts` (`'@granit/react-{module}/testing'` →
      `.../src/testing/index.ts`), declared **before** the broader base alias
      `'@granit/react-{module}'` so the subpath is not shadowed by prefix match.
      A missing or mis-ordered alias is BREAKING (tests can't resolve the import)
- [ ] **No duplicated test data**: tests import the shared fixtures from
      `@granit/react-{module}/testing` instead of hand-rolling the same domain DTO
      inline. Flag a `const x: {Name}Response = {…}` literal — or a `makeX()`
      factory rebuilding a DTO — where a matching fixture already exists as
      INCONSISTENCY (`Fix: import {fixture} from '@granit/react-{module}/testing'`;
      rebase `makeX()` on the fixture keeping spread-override). Same-package tests
      may import their own fixtures via relative `../testing/data`
- [ ] **Single source of truth**: a DTO shape change should require editing only
      `testing/data.ts`, not N test files. Legitimately inline: UI-specific props,
      form-input payloads, and edge values with no matching fixture
- [ ] **tsc after fixture refactors**: Vitest type-strips, so it will NOT catch
      `T | undefined` from fixture index access under `noUncheckedIndexedAccess`
      (`mock[0]` needs `mock[0]!`). Always run `tsc --noEmit` per touched package —
      the pre-commit `tsc -r` will otherwise block the commit

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

## 7. Layer Separation — 3-tier architecture (--scope layers)

Every domain now spans **three layers** with a strict one-way dependency
direction. The admin UI ships as dedicated `react-ui-*` packages on top of the
headless `react-*` packages on top of the framework-agnostic core:

```text
@granit/{module}           API layer (core)    types/ + api/ (Axios) + permissions.ts — framework-agnostic, NO React
        ▲
@granit/react-{module}     React headless      hooks/ + providers/ + testing/ — logic & data access, NO admin pages
        ▲
@granit/react-ui-{module}  React UI            components/ (pages, dialogs, columns, forms) on @granit/react-ui — NO data access
```

Dependency direction is **react-ui → react → core**, never reversed.
Prefer extending `@granit/arch-tests` over ad-hoc checks where a rule is
expressible as an import-boundary test.

### 7a. API layer — core `@granit/{module}`

- [ ] **No React**: no `react` / `react-dom` import, no JSX, no hooks. Only
      `types/`, `api/` (Axios functions), `permissions.ts` (if backend perms),
      `index.ts`
- [ ] **No react-layer dirs**: no `hooks/`, `components/`, `providers/`, or
      `testing/` MSW (checklist 5a forbidden mixes)
- [ ] **Owns the HTTP contract**: `api/` functions go through `@granit/api-client`
      (checklist 2d); this is the ONLY layer that performs domain HTTP

### 7b. React headless — `@granit/react-{module}`

- [ ] **Logic, not chrome**: `hooks/` (React Query + query-key factories),
      `providers/`, `testing/`. May ship low-level/primitive components, but NOT
      the admin pages/tables/dialogs/forms — those belong in `react-ui`
- [ ] **Depends on core only**: peerDeps include `@granit/{module}` (its core);
      NEVER depends on or imports a `react-ui-*` package
- [ ] **Ships the mocks**: provides `src/testing/` fixtures (+ MSW) per 5e
- [ ] **No `api/` dir**: HTTP lives in core; hooks call the core API functions
      (checklist 5a)

### 7c. React UI — `@granit/react-ui-{module}`

- [ ] **Presentational + composition**: `components/` (pages, dialogs, columns,
      forms), `locales/`, optional `lib/`. Built on `@granit/react-ui` (the
      shadcn/ui foundation)
- [ ] **No data access**: NO `api/` dir, NO `src/hooks/` performing HTTP, NO
      direct `@granit/api-client` / Axios / domain `fetch`. All data flows through
      the headless hooks (`@granit/react-{module}`). `@granit/api-client` may
      appear ONLY in `devDependencies` (test wiring), never `peerDependencies`.
      A runtime api-client/Axios dependency, a domain `fetch`, or a re-implemented
      fetching hook is BREAKING
- [ ] **Depends on the headless layer**: peerDeps include `@granit/react-{module}`
      and `@granit/react-ui` (+ core `@granit/{module}` for types). Does not depend
      on another domain's `react-ui-*` except via documented composition
- [ ] **No headless-logic duplication**: query keys, providers, and fetching hooks
      are imported from `@granit/react-{module}`, not redefined
- [ ] **i18n placement**: user-facing locale bundles live in this layer (or the
      headless layer if it surfaces strings), never in core

### 7d. Direction & boundaries (arch-test territory)

- [ ] **One-way deps only**: core imports nothing React; `react-{module}` imports
      core (not `react-ui-*`); `react-ui-{module}` imports `react-{module}` + core
      + `@granit/react-ui`. Flag any back-edge (core → react, react → react-ui) as
      BREAKING
- [ ] **Trio completeness**: a domain with a `react-ui-{module}` should have the
      full trio — core `@granit/{module}` + headless `@granit/react-{module}` +
      UI `@granit/react-ui-{module}`. A `react-ui-*` with no headless counterpart
      (data access inlined) is an INCONSISTENCY

### 7e. shadcn/ui usage — UI layer only (--scope ui)

shadcn/ui is the admin design system. Its primitives are **vendored once** in the
foundation package `@granit/react-ui` (Button, Input, Dialog, Table, Select,
Sidebar, Form, … — radix-ui wrappers + `cva` variants + `sonner` toasts). Domain
UI packages **compose** that foundation; they never re-vendor primitives, and the
shadcn stack never leaks below the UI tier.

Define the **shadcn stack** for these checks as the deps/imports:
`@granit/react-ui` (the wrappers), `radix-ui` / `@radix-ui/*`, `cmdk`, `sonner`,
`class-variance-authority` (`cva` variant authoring), `vaul`, plus the styling
helpers `cn` (from `@granit/utils`, = `clsx` + `tailwind-merge`) and raw Tailwind
class strings. Companions used alongside it: `lucide-react` (icons),
`react-hook-form` + `@hookform/resolvers` (the shadcn `Form` wrapper).

**Allowed only in the UI tier** — the foundation `@granit/react-ui`, the
cross-cutting `@granit/react-ui-admin-kit`, and the domain `react-ui-{module}`
packages. Confine each layer:

- [ ] **Foundation owns the primitives**: the shadcn primitive files (radix-ui /
      `cmdk` wrappers, `cva` variant definitions, `sonner` `Toaster`) live in
      `@granit/react-ui` and are exported from its single barrel. `radix-ui` /
      `cmdk` / `sonner` / `class-variance-authority` belong in this package's
      `peerDependencies`.
- [ ] **No core leak**: a core `@granit/{module}` (framework-agnostic, no React)
      must NOT carry any shadcn-stack dep or import — flag as BREAKING.
- [ ] **No headless leak**: a headless `@granit/react-{module}` must NOT depend on
      or import the shadcn primitive/styling stack — `@granit/react-ui`,
      `radix-ui` / `@radix-ui/*`, `cmdk`, `sonner`, `class-variance-authority`, or
      raw Tailwind class strings / `cn` for chrome. Headless ships logic
      (hooks/providers), not styled chrome. A shadcn import here is INCONSISTENCY
      (`Fix: move the styled component into @granit/react-ui-{module}`); a peerDep
      on `@granit/react-ui` is BREAKING (wrong-direction layer dep). `lucide-react`
      and `react-hook-form` are tolerated ONLY when the headless package ships a
      genuine unstyled primitive — a headless package rendering full pages/dialogs
      with icons is presentation that belongs in the UI tier (INCONSISTENCY).
- [ ] **Compose, don't re-vendor**: a domain `react-ui-{module}` imports primitives
      FROM `@granit/react-ui` (`import { Button, Dialog, Select } from
      '@granit/react-ui'`). A local re-implementation of a primitive the foundation
      already exports — a hand-rolled `button.tsx`/`dialog.tsx`, or a direct
      `radix-ui` import rebuilding a wrapped primitive — is an INCONSISTENCY
      (`Fix: import from @granit/react-ui`). Direct `radix-ui` is acceptable ONLY
      for a low-level composition the foundation does NOT yet wrap (as
      `@granit/react-ui-admin-kit` does for the smart-filter-bar); when a primitive
      is reused 3+ times, promote it into `@granit/react-ui` instead.
- [ ] **Styling via `cn` + tokens**: UI components combine classes with `cn` (from
      `@granit/utils`) and use `@granit/ui-theme` design-token CSS variables — not
      ad-hoc inline `style={}` colour/spacing literals or hard-coded hex that
      bypass the token contract (INCONSISTENCY).
- [ ] **Variants via `cva`**: component style variants are authored with
      `class-variance-authority` (matching the foundation's `Button`/`Badge`
      pattern), not sprawling conditional class concatenation (IMPROVEMENT).
- [ ] **Toasts via the foundation**: user notifications use the `sonner` `Toaster`
      / `toast` re-exported from `@granit/react-ui`, not a second `sonner` instance
      or a bespoke toast (INCONSISTENCY).

### 7f. Admin UI composition & structure (--scope ui)

Conventions for the domain `react-ui-{module}` packages, on top of the shadcn
foundation. Verify against the established patterns in `@granit/react-ui-parties`
/ `@granit/react-ui-account` and the `@granit/react-ui-admin-kit` building blocks.

- [ ] **Forms are spec-driven (no zod)**: forms use the shadcn `Form` wrapper from
      `@granit/react-ui` + react-hook-form, with a **spec-driven resolver** —
      `createConstraintsResolver(<module>Constraints.<Dto>, t, { labelResolver })`
      from `@granit/react-validation`, fed by the generated `src/constraints.ts` in
      the core package (regenerated by the `.husky/pre-commit` hook from
      `contracts/openapi/*.json` — NEVER hand-edit it). Types are hand-written,
      validation is derived from the spec (PR #727, which dropped `zod` framework-wide
      → `zod = 0`). A `zodResolver`, a `@hookform/resolvers` dep, or a hand-rolled
      zod schema validating a backend DTO is **legacy drift** — INCONSISTENCY
      (`Fix: generate constraints.ts + switch to createConstraintsResolver`).
      Inline react-hook-form `rules` with no resolver fail the `use-form-needs-resolver`
      arch-test. zod is acceptable ONLY for a purely client-side form with no backend
      DTO behind it (rare — confirm there is no matching spec before allowing it).
- [ ] **Grids compose admin-kit, not raw react-table**: server-paginated / query
      grids use the `@granit/react-ui-admin-kit` data-table family
      (`QueryDataTable`, `QueryEndpointDataTable`, `ManualDataTable`) — which wrap
      `@tanstack/react-table`, pagination, sort/group/column-visibility and the
      smart-filter-bar. A domain page calling `useReactTable` / `flexRender`
      directly to rebuild a paginated list is an INCONSISTENCY
      (`Fix: compose QueryEndpointDataTable from @granit/react-ui-admin-kit`).
      `@tanstack/react-table` as a dep is fine for the `ColumnDef<T>` *type* only —
      column definitions live in a `*-columns.tsx` file, the rendering goes through
      admin-kit.
- [ ] **Component placement under `src/components/`**: presentational components
      (pages, dialogs, columns, forms) live under `src/components/` (the canonical
      `react-ui-{module}` structure), not loose at `src/` root. A list-page or
      dialog `.tsx` at `src/` root when a `components/` dir exists is an
      INCONSISTENCY (`Fix: move under src/components/`).
- [ ] **Storybook coverage**: each non-trivial presentational component ships a
      co-located `*.stories.tsx` (the admin-kit standard). A new page/dialog/grid
      component with no story is a GAP (`Action: add a {Component}.stories.tsx`).
      Pure leaf wrappers and columns files are exempt.
- [ ] **Accessibility baseline (WCAG)**: icon-only controls carry an `aria-label`
      or an `sr-only` label; `Dialog`/`AlertDialog`/`Sheet` have a title
      (`DialogTitle`, or a visually-hidden one); form inputs are associated with a
      `FormLabel` / `<Label htmlFor>`. A new icon-only `Button` or untitled overlay
      is an INCONSISTENCY (`Fix: add aria-label / DialogTitle`). Audit statically —
      flag only clear omissions, not subjective contrast/landmark judgements.

### 7g. Framework-agnostic seam — multi-platform readiness (--scope layers)

The core/adapter split — framework-agnostic core `@granit/{module}` (types + api +
permissions, NO framework runtime) + a thin `react-{module}` adapter — is what would
let a future non-React adapter (`@granit/angular-{module}`, `@granit/{module}-native`)
sit on the SAME core. Precedents already follow it: `validation` / `react-validation`,
`query-engine` / `react-query-engine`, `entity-merge` / `react-entity-merge`. Do NOT
build other adapters now (YAGNI) — just keep the seam clean so a port stays cheap.

- [ ] **R1 — no React ecosystem in an agnostic core**: a package WITHOUT the
      `react-` prefix must not import `react`, `react-dom`, or `@tanstack/react-query`.
      The framework-neutral query core is `@tanstack/query-core` (React/Angular/Vue
      layer their own adapters on top of it). Enforced by the `imports` arch-test
      (`framework-agnostic packages do not import the React ecosystem`); current
      allowlisted debt: `@granit/shell-core` (`src/query-client.ts` imports
      `@tanstack/react-query` — migrate to `@tanstack/query-core`). BREAKING.
- [ ] **R2 — no platform globals in a portable core**: a *domain* core that should be
      portable avoids direct `window` / `document` / `localStorage` / `sessionStorage`
      / `navigator` access; platform concerns (persistence, navigation, redirect) go
      behind an injected port (web → `localStorage`, RN → `AsyncStorage`). **Audit
      manually — there is no arch-test**: a regex can't separate runtime use from
      JSDoc/string mentions without an AST, and several cores are *legitimately* web
      platform abstractions, NOT violations — `@granit/cookies` (`document.cookie`),
      WebAuthn passkeys (`navigator.credentials`), OAuth redirect (`window.location`).
      Flag only a domain core reaching for a global it could have injected.
      INCONSISTENCY.
- [ ] **R3 — UI does not hard-bind a web router**: a `react-ui-{module}` page should
      receive navigation via a thin port/props, not `import … from 'react-router-dom'`
      / `'react-router'` directly, so React Native (react-navigation) or Angular Router
      can substitute. Enforced as a **ratchet** by the `imports` arch-test (`react-ui
      packages do not add NEW direct web-router imports`): the current offenders are
      baselined (`UI_ROUTER_BASELINE`); no NEW `react-ui-*` may add a direct router
      import, and the baseline should SHRINK as pages migrate. INCONSISTENCY.

---

## Suppressions — DO NOT flag

- Style-only issues (formatting, import order) — linter handles this
- Missing JSDoc on internal functions — only flag on public API
- "Could be more generic" — don't suggest abstractions without 3+ duplicates
- Test file organization (naming, folder structure)
- `pnpm-lock.yaml` changes
- Packages that are explicitly marked as placeholders/skeletons
