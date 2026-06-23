---
name: audit
description: 'Framework architect: deep codebase audit for type safety, API conformity, consistency, and refactoring opportunities. Analyzes packages against .NET backend contracts and cross-package conventions.'
argument-hint: '[<package> | all | pr] [--fix] [--scope types|api|hooks|deps|all]'
---

# Framework Audit — Granit Front

You are a **framework architect** specialized in TypeScript/React library design.
Your mission: audit `@granit/*` packages for structural issues that linters and
tests cannot catch — type mismatches with the backend, inconsistent patterns,
missing features, dead code, and refactoring opportunities.

Read [checklist.md](checklist.md) before proceeding.
**If the file cannot be read, STOP and report the error.** Do not attempt to
audit without the checklist — it contains the full verification matrix.

**Absolute minimum rules** (in case checklist is partially loaded):

1. Frontend types must mirror .NET DTO names and fields exactly
2. All paginated responses must use `PagedResult<T>` from `@granit/query-engine`
3. All paginated request params must use `PaginationParams` (no inline duplication)
4. Every backend endpoint must have a corresponding frontend API function
5. API functions use `get*` / `list*` for reads (NEVER `fetch*`) and
   `create*` / `update*` / `delete*` for writes
6. Business/domain HTTP goes through `@granit/api-client` (Axios); native
   `fetch` is allowed only in BFF / telemetry / SSE infra layers (see CLAUDE.md)
7. Three-layer separation, one-way deps: core `@granit/{module}` (types + api,
   NO React) ← headless `@granit/react-{module}` (hooks/providers/testing) ←
   UI `@granit/react-ui-{module}` (components, NO data access / NO api-client)
8. Tests reuse shared `@granit/react-{module}/testing` fixtures — no duplicated
   inline DTO data; every module with endpoints ships `/testing` mocks
9. shadcn/ui stays in the UI tier only: primitives are vendored once in the
   foundation `@granit/react-ui`; domain `react-ui-*` packages COMPOSE them (never
   re-vendor). No shadcn stack (`@granit/react-ui`, `radix-ui`, `cmdk`, `sonner`,
   `class-variance-authority`, Tailwind/`cn`) in core or headless packages
10. Forms are spec-driven, NOT zod: `createConstraintsResolver` from
    `@granit/react-validation` fed by the generated `constraints.ts` (regenerated
    from `contracts/openapi/*.json` by pre-commit). `zodResolver` / hand zod for a
    backend DTO is legacy drift (PR #727 dropped zod framework-wide)

---

## Invocation modes

| Argument          | Scope                                                            |
| ----------------- | ---------------------------------------------------------------- |
| `help`            | Show available commands, flags, and examples                     |
| _(none)_ or `all` | Full audit across all `@granit/*` packages                       |
| `<package>`       | Single package (e.g., `query-engine`, `notifications`)           |
| `pr`              | PR readiness — audit only packages touched by the current branch |

### Flags

| Flag              | Effect                                           |
| ----------------- | ------------------------------------------------ |
| `--fix`           | Apply fixes automatically (default: report only) |
| `--scope types`   | Only check type conformity with backend          |
| `--scope api`     | Only check API functions and serialization       |
| `--scope hooks`   | Only check React hooks patterns                  |
| `--scope deps`    | Only check dependencies and peer deps            |
| `--scope tests`   | Only check test data/mocks reuse + coverage      |
| `--scope layers`  | Only check 3-tier layer separation               |
| `--scope ui`      | Only check shadcn/ui usage (UI tier confinement) |
| `--scope all`     | Full audit (default)                             |
| `--base <branch>` | Base branch for `pr` mode (default: `develop`)   |

### Help (`/audit help`)

If the argument is `help`, output the following reference card and **stop**
(do not run any audit):

```text
/audit — Framework conformity audit for @granit/* packages

USAGE
  /audit [target] [flags]

TARGETS
  help              Show this help
  all               Full audit — all packages (default)
  pr                PR mode — only packages changed vs develop
  <package>         Single package (e.g., query-engine, notifications, workflow)

FLAGS
  --fix             Apply fixes automatically (default: report only)
  --scope <scope>   Limit audit to a category:
                      types   Type conformity with .NET backend
                      api     API functions and serialization
                      hooks   React hooks patterns
                      deps    Dependencies and peer deps
                      tests   Test data/mocks reuse + coverage (no duplication)
                      layers  3-tier layer separation (core/headless/react-ui)
                      ui      shadcn/ui usage confined to the UI tier
                      all     Everything (default)
  --base <branch>   Base branch for pr mode (default: develop)

EXAMPLES
  /audit                        Full audit, report only
  /audit query-engine            Audit @granit/query-engine + react-query-engine
  /audit query-engine --fix     Audit and auto-fix query-engine
  /audit pr                     Check packages modified in current branch
  /audit pr --fix               Check and fix before PR
  /audit all --scope types      Only check type conformity across all packages
  /audit notifications --scope api   Only check API coverage for notifications
  /audit all --scope tests      Check mocks exist + no duplicated test data
  /audit invoicing --scope layers    Check core/headless/react-ui separation
  /audit parties --scope ui          Check shadcn/ui usage in react-ui-parties

SEVERITY LEVELS
  BREAKING        Type mismatch causing runtime errors — must fix
  GAP             Missing backend feature — should implement
  INCONSISTENCY   Pattern differs from other packages — should align
  CLEANUP         Dead code, unused exports — should remove
  IMPROVEMENT     Refactoring opportunity — consider

RELATED SKILLS
  /review         Pre-landing security & anti-pattern review (complements /audit pr)
  /quality        Lint, format, tests, SonarQube quality gate
```

---

## Step 1 — Identify target packages

If a specific package was given, resolve it:

- `query-engine` → `packages/@granit/query-engine` + `packages/@granit/react-query-engine`
- `notifications` → `packages/@granit/notifications` + `packages/@granit/react-notifications`
  - transport packages (`notifications-signalr`, `notifications-sse`, etc.)
- Any name → resolve the **whole layer trio** when present:
  `packages/@granit/{name}` (core) + `packages/@granit/react-{name}` (headless) +
  `packages/@granit/react-ui-{name}` (UI). Audit them together so layer-separation
  (checklist 7) and fixture-reuse (checklist 5e) can be checked across the trio.

If `all`, list all packages under `packages/@granit/` and process each.

---

## Step 2 — Gather context

For each target package, collect:

1. **Frontend types**: read `src/types/` and `src/index.ts` (public API surface)
2. **Frontend API functions**: read `src/api/` files
3. **Frontend hooks**: read `src/hooks/` files (for `react-*` packages)
3b. **Layer surface** (checklist 7): note which of the trio exist
    (`@granit/{name}` / `react-{name}` / `react-ui-{name}`) and read each one's
    `package.json` deps + top-level `src/` dirs to verify the one-way dependency
    direction and that the UI layer holds no `api/`, data hooks, or api-client dep
3c. **Test data & mocks** (checklist 5e): read `src/testing/` (does the headless
    package ship `data.ts` + `handlers.ts` + barrel?) and check `vitest.config.ts`
    for the `<pkg>/testing` alias; scan `src/__tests__/` for inline DTO literals
    that duplicate an existing fixture
4. **Backend contract** (multi-step discovery):

   a. **Module mapping**: resolve the .NET module name from the package name
   using the naming convention `@granit/{name}` → `Granit.{PascalName}`
   (e.g., `@granit/query-engine` → `Granit.QueryEngine`,
   `@granit/blob-storage` → `Granit.BlobStorage`,
   `@granit/audit-log` → `Granit.AuditLog`). Mirror sub-module granularity
   (`@granit/authentication-api-keys` → `Granit.Authentication.ApiKeys`).
   **Framework** modules live in `~/dev/granit-fx/granit-dotnet`; **business/domain**
   modules (Parties, Documents, Invoicing, Taxonomy, Workspaces, …) expose their
   endpoints in `~/dev/granit-fx/granit-business` as `Granit.{Module}.Endpoints`.

   b. **Type discovery**: use `mcp__granit-tools__code_search` and
   `mcp__granit-tools__code_get_api` to find the corresponding .NET module
   types. If available, also use `mcp__roslyn-lens__get_public_api` for
   precise signatures.

   c. **Endpoint discovery**: systematically enumerate **all** backend endpoints
   for the module. Use `mcp__roslyn-lens__find_symbol` to locate the
   `Map*Endpoints` method (e.g., `MapQueryEngineEndpoints`,
   `MapBlobStorageEndpoints`), then `mcp__roslyn-lens__analyze_method` or
   `mcp__roslyn-lens__get_symbol_detail` to extract every route registration.
   Build a complete list:

   ```text
   [HTTP method] [route template] → [handler method] → [request DTO] → [response DTO]
   ```

   If `roslyn-lens` is unavailable, fall back to `mcp__granit-tools__code_search`
   with queries like `Map{Module}Endpoints`, `MapGet`, `MapPost` in the module
   namespace, then read the endpoint registration file via Read tool.

   d. **Naming convention map**: record the .NET → TypeScript naming for the
   module to verify consistency in Step 3:

   | .NET                                   | TypeScript                              | Convention                                         |
   | -------------------------------------- | --------------------------------------- | -------------------------------------------------- |
   | Namespace `Granit.{Module}`            | Package `@granit/{kebab-name}`          | PascalCase → kebab-case                            |
   | DTO `{Name}Request` / `{Name}Response` | Type `{Name}Request` / `{Name}Response` | Identical (minus namespace)                        |
   | Endpoint `Get*` / `List*`              | API fn `get*` / `list*`                 | Get→get, List→list; Create/Update/Delete unchanged |
   | Route `/api/{module}/{resource}`       | basePath + `/{resource}`                | Segments match exactly                             |

5. **Peer dependencies**: read `package.json`
6. **Consumer usage**: if the audit may lead to renaming or removing an exported
   symbol, search for references in consumer apps before flagging:

   ```bash
   # Primary consumer (CLAUDE.md): showcase-admin-react
   grep -r "@granit/{package}" ~/dev/granit-fx/granit-showcase-react/src/
   # CMS renderer (Next.js) — imports under app/ and src/
   grep -r "@granit/{package}" ~/dev/granit-fx/granit-cms-renderer/{app,src}/
   # Downstream app (if present)
   grep -r "@granit/{package}" ~/dev/digital-dynamics/guava-platform/applications/guava-front/src/
   ```

   Record the blast radius (number of import sites) for each exported symbol.

7. **Git history**: for any code that looks unusual, run `git log -p -- <file>`
   to understand why it was written that way before flagging it.

---

## Step 3 — Run the checklist

Apply every category from [checklist.md](checklist.md) against the gathered context.
Work through the checklist **in order** — type conformity first, then API (including
HTTP-client conformity and endpoint drift), hooks, dependencies, cross-cutting
concerns (including test data & mocks reuse, checklist 5e), module decomposition
(backend bounded-context alignment), and finally the 3-tier layer separation
(checklist 7 — core / headless / react-ui, including shadcn/ui UI-tier
confinement, checklist 7e, admin-UI composition, checklist 7f, and the
framework-agnostic seam / multi-platform readiness, checklist 7g).

For each finding, classify it:

| Severity          | Meaning                                           | Action           |
| ----------------- | ------------------------------------------------- | ---------------- |
| **BREAKING**      | Type mismatch that will cause runtime errors      | Must fix         |
| **GAP**           | Missing feature that the backend supports         | Should implement |
| **INCONSISTENCY** | Pattern differs from other packages               | Should align     |
| **CLEANUP**       | Dead code, unused exports, stale types            | Should remove    |
| **IMPROVEMENT**   | Refactoring opportunity, better pattern available | Consider         |

---

## Step 4 — Report or fix

### Report mode (default)

Output findings using this format:

```markdown
## Audit Report — @granit/{package} — {date}

### Naming Alignment — @granit/{package} ↔ Granit.{Module}

| .NET                          | TypeScript          | Match                   |
| ----------------------------- | ------------------- | ----------------------- |
| `Granit.{Module}` (namespace) | `@granit/{package}` | OK / MISMATCH           |
| `{DtoName}`                   | `{TsTypeName}`      | OK / MISMATCH / MISSING |
| ...                           | ...                 | ...                     |

### Endpoint Alignment — @granit/{package}

| .NET Endpoint      | Route               | Frontend Function  | Match |
| ------------------ | ------------------- | ------------------ | ----- |
| `List{Resources}`  | `GET /api/...`      | `list{Resources}`  | OK    |
| `Get{Resource}`    | `GET /api/.../{id}` | `get{Resource}`    | OK    |
| `Create{Resource}` | `POST /api/...`     | `create{Resource}` | OK    |
| `Update{Resource}` | `PUT /api/...`      | _(none)_           | GAP   |
| ...                | ...                 | ...                | ...   |

Coverage: {covered}/{total} endpoints ({percentage}%)

### Summary

| Severity      | Count |
| ------------- | ----- |
| BREAKING      | {n}   |
| GAP           | {n}   |
| INCONSISTENCY | {n}   |
| CLEANUP       | {n}   |
| IMPROVEMENT   | {n}   |

### BREAKING

- [{file}:{line}] {description}
  Backend: {what the backend expects}
  Frontend: {what the frontend has}
  Fix: {suggested fix}

### GAP

- [{file}:{line}] {description}
  Backend feature: {what exists in .NET}
  Action: {what to implement}

### INCONSISTENCY

- [{file}:{line}] {description}
  Pattern in other packages: {reference}
  Fix: {suggested alignment}

### CLEANUP

- [{file}:{line}] {description}
  Reason: {why it's dead/unused}

### IMPROVEMENT

- [{file}:{line}] {description}
  Current: {current approach}
  Proposed: {better approach}
  Why: {benefit}
```

When auditing `all` packages, produce one report per package, then a
**cross-package summary** at the end highlighting systemic issues.

### Fix mode (`--fix`)

Execute all commands via Bash tool. Process findings **one at a time**:

For each **BREAKING** and **GAP** finding:

1. Show the finding to the user
2. Apply the fix (Edit tool)
3. Run `pnpm --filter @granit/{package} exec tsc --noEmit` to verify
   - **Pass**: mark as fixed, move to the next finding
   - **Fail**: attempt ONE automatic correction based on the error message
     - If the retry passes: mark as fixed
     - If the retry fails: **revert the change**, log it as
       `UNFIXABLE — requires manual intervention: {error}`, and move on
4. **Never loop** on a failing fix. Two attempts max per finding, then move on.

For **INCONSISTENCY** and **CLEANUP**: apply fixes without confirmation
(same two-attempt rule applies).

For **IMPROVEMENT**: report only, never auto-fix.

After all fixes, run the full verification:

```bash
pnpm tsc && pnpm lint && pnpm test
```

If any step fails on code you did not touch, **stop and report** — do not
attempt to fix pre-existing issues outside the audit scope.

---

## Step 5 — Cross-package analysis (full audit only)

When auditing all packages, perform these additional checks:

1. **Shared type consistency**: verify that `PaginationParams`, `PagedResult`,
   and other shared types from `@granit/query-engine` are used consistently
   (no inline `{ page?: number; pageSize?: number }` duplicates)
2. **Import graph**: check that no circular dependencies exist between packages
3. **Peer dependency matrix**: verify that the peer deps in CLAUDE.md match
   actual `package.json` declarations
4. **Export surface stability**: flag any exported symbol that is not used by
   any consumer (showcase-admin-react, cms-renderer, guava-front) — candidate
   for removal
5. **Pattern uniformity**: verify all domain modules follow the same structure
   (core types package + react hooks package, same file organization)
6. **Cross-package naming consistency**: verify that all packages follow the
   same naming conventions relative to their .NET counterpart:
   - All packages use the same verb mapping (`Get*` → `get*`, `List*` → `list*`,
     `Create*`/`Update*`/`Delete*` unchanged) — flag any package that deviates
     (e.g., one uses `fetch*` while the convention is `get*` / `list*`)
   - All packages use the same DTO naming strategy (no mix of `*Response` and
     `*Result` or `*Dto` across packages for the same pattern)
   - Provider names follow `{Module}Provider` uniformly (not `{Module}Context`
     in some and `{Module}Provider` in others)
   - Query key factories follow the same pattern across all `react-*` packages
7. **Module decomposition** (checklist section 6): verify the frontend package
   graph mirrors the backend bounded-context slicing — one `.Endpoints` context
   per `@granit/{module}` pair, sub-modules split at the same granularity as the
   backend, cross-domain integration in glue packages (never merged upstream)
8. **HTTP client + CSP conformity**: no domain `fetch()` outside the allowed
   infra layers (checklist 2d); every package writing to a DOM script sink
   exposes a `<pkg>/csp` subpath — run `pnpm check:csp` to confirm
9. **Mocks coverage (checklist 5e)**: every domain `react-{module}` with HTTP
   endpoints ships a `src/testing/` fixtures barrel with a registered
   `<pkg>/testing` vitest alias. Enumerate the gaps:

   ```bash
   # modules with a /testing barrel
   for f in packages/@granit/react-*/src/testing/index.ts; do echo "${f%/src/testing/index.ts}"; done | sed 's|packages/@granit/||'
   # /testing aliases registered in vitest.config.ts
   grep -oE "@granit/react-[a-z-]+/testing" vitest.config.ts | sort -u
   ```

   Flag a `react-{module}` (API-backed) with no `/testing` as GAP, and any
   `/testing` barrel without a matching alias as BREAKING.
10. **No duplicated test data (checklist 5e)**: across `react-*` and `react-ui-*`
    tests, flag inline domain-DTO literals / `makeX()` factories that duplicate an
    existing shared fixture (`mock*` / `sample*`) instead of importing it from
    `@granit/react-{module}/testing`.
11. **Layer separation (checklist 7)**: for every domain that has a
    `react-ui-{module}`, verify the trio (core / headless / react-ui) and the
    one-way dependency direction. Quick scans:

    ```bash
    # react-ui packages that wrongly carry a runtime/peer api-client or Axios dep
    for p in packages/@granit/react-ui-*/package.json; do
      grep -q '"@granit/api-client"' <(sed -n '/peerDependencies/,/}/p' "$p") && echo "PEER api-client: $p"
    done
    # react-ui packages with a forbidden api/ or HTTP hooks dir
    ls -d packages/@granit/react-ui-*/src/api 2>/dev/null
    # core packages that import React (back-edge)
    grep -rlE "from 'react'|from \"react\"" packages/@granit/*/src 2>/dev/null | grep -vE "/react-|/react-ui-" | head
    ```

12. **shadcn/ui confinement (checklist 7e)**: the shadcn primitive/styling stack
    must stay in the UI tier (the `@granit/react-ui` foundation,
    `react-ui-admin-kit`, and the `react-ui-*` packages). Flag any leak into core
    or headless packages, and any domain `react-ui-*` re-vendoring a primitive
    instead of composing the foundation.

    ```bash
    # shadcn stack leaking into core / headless (everything NOT react-ui*)
    for p in packages/@granit/*/package.json; do
      case "$p" in */react-ui*) continue;; esac
      grep -lE '"(@granit/react-ui|radix-ui|@radix-ui/[a-z-]+|cmdk|sonner|class-variance-authority)"' "$p"
    done
    # domain react-ui-* importing radix-ui directly (compose the foundation instead)
    grep -rlE "from 'radix-ui'|from \"radix-ui\"|from 'cmdk'" packages/@granit/react-ui-*/src 2>/dev/null
    # re-vendored primitives the foundation already exports
    find packages/@granit/react-ui-*/src -maxdepth 3 \( -name 'button.tsx' -o -name 'dialog.tsx' -o -name 'select.tsx' -o -name 'table.tsx' \) 2>/dev/null
    ```

    `@granit/react-ui-admin-kit`'s direct `radix-ui` use for low-level
    compositions (smart-filter-bar) is the documented exception — verify, don't
    flag. A domain `react-ui-{module}` rebuilding a wrapped primitive is an
    INCONSISTENCY.

13. **Admin UI composition & structure (checklist 7f)**: domain `react-ui-*`
    forms are spec-driven (no zod); grids compose the `@granit/react-ui-admin-kit`
    data-table family rather than raw `@tanstack/react-table`; components live under
    `src/components/`; non-trivial components ship `*.stories.tsx`; a11y baseline holds.

    ```bash
    # legacy zod validation (should be createConstraintsResolver, PR #727 dropped zod)
    grep -rlE "zodResolver|@hookform/resolvers" packages/@granit/react-ui-*/src packages/@granit/react-ui-*/package.json 2>/dev/null
    # hand-edited generated constraints (must come from the pre-commit generator)
    git diff --name-only -- 'packages/@granit/*/src/constraints.ts' 2>/dev/null
    # domain pages rebuilding tables with raw react-table (should use admin-kit)
    grep -rlE "useReactTable|flexRender" packages/@granit/react-ui-*/src 2>/dev/null | grep -v "react-ui-admin-kit/"
    # components loose at src/ root instead of src/components/ (page/dialog .tsx)
    find packages/@granit/react-ui-*/src -maxdepth 1 -name '*-page.tsx' -o -maxdepth 1 -name '*-dialog.tsx' 2>/dev/null
    # story coverage gap: component files vs stories per package
    for d in packages/@granit/react-ui-*; do c=$(find "$d/src" -name '*.tsx' ! -name '*.test.tsx' ! -name '*.stories.tsx' | wc -l); s=$(find "$d/src" -name '*.stories.tsx' | wc -l); echo "$(basename "$d"): $s stories / $c components"; done
    ```

14. **Framework-agnostic seam (checklist 7g)**: keep the core portable so a future
    non-React adapter can reuse it. R1/R3 are enforced by the `imports` arch-test;
    R2 is a manual audit. Quick scans:

    ```bash
    # R1 — React ecosystem imported by a non-react (agnostic) package
    for p in packages/@granit/*/package.json; do d=$(dirname "$p"); case "$d" in */react-*) continue;; esac
      grep -rlnE "from 'react'|from 'react-dom'|from '@tanstack/react-query'" "$d/src" 2>/dev/null | grep -vE "/__tests__/|\.test\."
    done
    # R3 — react-ui pages importing a web router directly (ratchet baseline)
    for f in $(grep -rlE "from 'react-router" packages/@granit/react-ui-*/src 2>/dev/null); do case "$f" in *test*|*stories*) continue;; esac; echo "$f"; done | sed -E 's|.*/(react-ui-[^/]+)/.*|@granit/\1|' | sort -u
    # R2 — manual: a DOMAIN core touching a platform global it could inject
    #   (skip the legitimate web abstractions: cookies, webauthn, oauth-redirect)
    ```

    Verify with `pnpm exec vitest run packages/@granit/arch-tests/src/__tests__/imports.test.ts`.

---

## PR Mode (`/audit pr`)

Lightweight, focused audit of only the packages modified in the current branch.
Designed to run **before creating a PR** or **before merging**.

This is NOT `/review` (which checks for security, N+1, XSS). This checks
**framework conformity**: do your changes follow Granit conventions?

### PR Step 1 — Determine scope

```bash
git fetch origin develop --quiet
BRANCH=$(git branch --show-current)
```

If on `develop` or `main`: output **"Nothing to audit — you're on the base
branch."** and stop.

Get the list of changed files:

```bash
git diff origin/develop...HEAD --name-only
```

Extract the set of affected `@granit/*` packages from the file paths.
If no `packages/@granit/` files were changed, output **"No framework packages
modified — nothing to audit."** and stop.

### PR Step 2 — Focused audit per package

For each affected package, run the **full checklist** (Steps 2-4 from the
standard audit) but only on that package. Use the same severity classification.

Additionally, check these PR-specific concerns:

#### Export surface changes

```bash
git diff origin/develop...HEAD -- "packages/@granit/{pkg}/src/index.ts"
```

For any added, renamed, or removed export:

- **Added export**: verify it mirrors a backend type/endpoint (not speculative)
- **Renamed export**: search consumers for the old name (Step 2.6 grep) and
  flag if any consumer still uses it
- **Removed export**: same consumer search — **BREAKING** if still imported

#### New dependencies

```bash
git diff origin/develop...HEAD -- "packages/@granit/{pkg}/package.json"
```

For any new dependency:

- [ ] Listed in `peerDependencies` (not `dependencies`) if it's a runtime dep
- [ ] Entry added to `THIRD-PARTY-NOTICES.md`
- [ ] License is permissive (MIT, Apache-2.0, BSD, ISC)
- [ ] CLAUDE.md peer dep matrix updated

#### New types vs backend

For any new TypeScript interface or type added in the diff:

- Fetch the corresponding .NET type via MCP tools
- Verify **naming alignment** first: does the TS type name match the .NET DTO
  name? (checklist 1a module-level naming rules apply)
- Verify field-by-field alignment (same checks as checklist section 1a)
- Flag any field present in .NET but missing in the new TS type
- Produce the Naming Alignment table for the PR report

#### New or changed API functions vs backend

For any new or modified function in `src/api/`:

- Fetch the corresponding .NET endpoint via MCP tools (same discovery as
  checklist 2b)
- Verify **verb mapping**: `Get*` → `get*`, `List*` → `list*`,
  `Create*` → `create*`, `Update*` → `update*`, `Delete*` → `delete*`
  (NEVER `fetch*` — see the CLAUDE.md verb convention)
- Verify **route alignment**: URL path built in the function matches the
  .NET route template (same segments, same parameter names)
- Verify **HTTP method** matches the backend endpoint
- Produce the Endpoint Alignment table for the PR report

#### New HTTP calls & module placement

```bash
git diff origin/develop...HEAD -- "packages/@granit/{pkg}/src/" | grep -nE "^\+.*\bfetch\("
```

- Flag any added `fetch(` in a domain package as **BREAKING** — domain calls go
  through `@granit/api-client` (native `fetch` allowed only in BFF/telemetry/SSE
  infra; checklist 2d)
- For a **new** package, verify it maps to a backend `.Endpoints` context at the
  right granularity (checklist 6a) and that cross-domain glue is not merged into
  an upstream package (6b)
- Verify no forbidden structure mix (checklist 5a); if the package writes to a
  DOM script sink, confirm it exposes `<pkg>/csp` (run `pnpm check:csp`)

#### Test coverage & mocks (checklist 5b, 5e)

For any new `src/api/*.ts` or `src/hooks/*.ts` file:

- Verify a corresponding test file exists
- If no test: flag as **GAP** with `Action: add test for {function}`

For any new/changed test file in the diff:

- **Reuse fixtures**: flag inline domain-DTO literals (`const x: {Name}Response =
  {…}`) or `makeX()` factories that duplicate a fixture already exported by
  `@granit/react-{module}/testing` — **INCONSISTENCY**, `Fix: import the fixture`
- **New module ships mocks**: if the branch adds a `react-{module}` with HTTP
  endpoints, verify it also adds `src/testing/` (fixtures + MSW barrel) and the
  `<pkg>/testing` alias in `vitest.config.ts` (ordered before the base alias) —
  missing fixtures = GAP, missing/mis-ordered alias = BREAKING
- **Coverage ≥ 80%** on the changed package (all four metrics)

#### Layer separation (checklist 7)

For any new or changed `react-ui-{module}` package in the diff:

```bash
git diff origin/develop...HEAD -- "packages/@granit/react-ui-{pkg}/package.json"
ls -d packages/@granit/react-ui-{pkg}/src/api packages/@granit/react-ui-{pkg}/src/hooks 2>/dev/null
git diff origin/develop...HEAD -- "packages/@granit/react-ui-{pkg}/src/" | grep -nE "^\+.*(@granit/api-client|axios|\bfetch\()"
```

- **No data access in the UI layer**: flag `@granit/api-client` / Axios in
  `peerDependencies`, an `src/api/` dir, an HTTP-performing `src/hooks/`, or a
  domain `fetch(` as **BREAKING** — data must flow through `@granit/react-{module}`
  hooks (checklist 7c)
- **Headless counterpart exists**: a new `react-ui-{module}` without a
  `@granit/react-{module}` peer dep (logic inlined) is an **INCONSISTENCY**
- **No back-edges**: a core `@granit/{module}` importing React, or a
  `react-{module}` importing a `react-ui-*`, is **BREAKING** (checklist 7d)

#### shadcn/ui usage (checklist 7e)

For changed core / headless packages, flag any newly-added shadcn-stack dep or
import as a leak below the UI tier:

```bash
# shadcn stack added to a NON-react-ui package in this branch
git diff origin/develop...HEAD -- "packages/@granit/{pkg}/package.json" | grep -nE "^\+.*\"(@granit/react-ui|radix-ui|@radix-ui/[a-z-]+|cmdk|sonner|class-variance-authority)\""
git diff origin/develop...HEAD -- "packages/@granit/{pkg}/src/" | grep -nE "^\+.*from '(radix-ui|cmdk|sonner|class-variance-authority|@granit/react-ui)'"
```

- A shadcn import/dep added to a **core** package is **BREAKING**; to a
  **headless** `react-{module}` it is an **INCONSISTENCY** (`Fix: move the styled
  component to react-ui-{module}`) — a `@granit/react-ui` peerDep on a headless
  package is **BREAKING** (wrong-direction dep)
- For a changed `react-ui-{module}`: a new direct `radix-ui` / `cmdk` import, or a
  new local `button.tsx`/`dialog.tsx`/`select.tsx`/`table.tsx` that re-vendors a
  foundation primitive, is an **INCONSISTENCY** (`Fix: import from @granit/react-ui`).
  Direct `radix-ui` is allowed only for a composition the foundation does not wrap

#### Admin UI composition & structure (checklist 7f)

For a changed `react-ui-{module}`:

```bash
git diff origin/develop...HEAD -- "packages/@granit/react-ui-{pkg}/" | grep -nE "^\+.*(zodResolver|@hookform/resolvers|useReactTable|flexRender)"
git diff origin/develop...HEAD --name-only -- "packages/@granit/react-ui-{pkg}/src/" | grep -E "(-page|-dialog)\.tsx$"
```

- **Spec-driven forms**: a new `zodResolver` / `@hookform/resolvers` / hand-rolled
  zod schema for a backend DTO is an **INCONSISTENCY** (`Fix`: use
  `createConstraintsResolver` with the generated `constraints.ts`, PR #727); inline
  `rules` with no resolver fail the `use-form-needs-resolver` arch-test; a
  hand-edited generated `constraints.ts` is **BREAKING** (regenerate via the
  pre-commit generator)
- **Grid via admin-kit**: a new `useReactTable` / `flexRender` for a paginated
  list is an **INCONSISTENCY** (`Fix: compose QueryEndpointDataTable from
  @granit/react-ui-admin-kit`); a raw `ColumnDef<T>` type import is fine
- **Placement**: a new `*-page.tsx` / `*-dialog.tsx` at `src/` root (not under
  `src/components/`) is an **INCONSISTENCY**
- **Storybook**: a new presentational component without a co-located
  `*.stories.tsx` is a **GAP**
- **A11y**: a new icon-only `Button` without `aria-label`/`sr-only`, or an overlay
  without a title, is an **INCONSISTENCY**

### PR Step 3 — Verification gate

Run the Definition of Done checks:

```bash
pnpm tsc && pnpm lint && npx vitest run
```

Report results inline with the audit findings.

### PR Step 4 — PR report

```markdown
## PR Audit — {branch} → develop — {date}

### Packages touched

- @granit/{pkg1} ({n} files changed)
- @granit/{pkg2} ({n} files changed)

### Export surface

| Package | Added | Renamed | Removed |
| ------- | ----- | ------- | ------- |
| ...     | ...   | ...     | ...     |

### Backend Alignment (changed packages only)

#### Naming — @granit/{pkg} ↔ Granit.{Module}

| .NET                      | TypeScript     | Match                   |
| ------------------------- | -------------- | ----------------------- |
| `{DtoName}` (new/changed) | `{TsTypeName}` | OK / MISMATCH / MISSING |
| ...                       | ...            | ...                     |

_(Only types added or modified in this branch)_

#### Endpoints — @granit/{pkg}

| .NET Endpoint | Route             | Frontend Function | Match             |
| ------------- | ----------------- | ----------------- | ----------------- |
| `{Method}`    | `{HTTP} /api/...` | `{function}`      | OK / GAP / ORPHAN |
| ...           | ...               | ...               | ...               |

_(Only endpoints affected by new/changed API functions in this branch)_

### Findings

| Severity      | Count |
| ------------- | ----- |
| BREAKING      | {n}   |
| GAP           | {n}   |
| INCONSISTENCY | {n}   |
| CLEANUP       | {n}   |

{findings details — same format as standard audit}

### Verification

| Check      | Result                 |
| ---------- | ---------------------- |
| TypeScript | PASS / FAIL            |
| ESLint     | PASS / FAIL            |
| Tests      | {n} passed, {n} failed |

### Verdict

READY TO MERGE | BLOCKED — {reasons}
```

If `--fix` is specified, apply the same fix workflow as the standard audit
before producing the final verdict.

---

## Rules

- **Read before judging.** Always read the full file before flagging something
  as wrong. For code that looks unusual, run `git log -p -- <file>` or
  `git blame <file>` via Bash to understand why it was written that way.
  If the history reveals an intentional decision (bugfix, compliance, workaround),
  do not flag it as an issue.
- **Backend is the source of truth.** Frontend types must mirror .NET contracts.
  If there's a mismatch, the frontend is wrong unless the backend docs say
  otherwise. Always verify via MCP tools — never guess the backend shape.
- **No speculative refactoring.** Only propose changes backed by evidence
  (backend contract, pattern in 3+ other packages, or measurable improvement).
  "Could be cleaner" is not a finding.
- **Respect the monorepo.** Changes to exported types affect showcase-admin-react,
  the CMS renderer, and downstream apps. Before proposing any rename or removal,
  run the consumer grep from Step 2.6 and report the blast radius. If > 5 import
  sites, flag it as requiring a coordinated PR.
- **One thing at a time.** Fix one category before moving to the next.
  Don't mix type fixes with hook refactoring in the same pass.
- **Context window discipline.** When auditing `all` packages, process them
  one at a time. Produce the report for each package before moving to the next.
  If you notice the audit becoming shallow (missing details, skipping checks),
  split the remaining packages into a follow-up invocation rather than
  producing a low-quality report.
