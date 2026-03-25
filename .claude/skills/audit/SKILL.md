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
- Any name → `packages/@granit/{name}` + `packages/@granit/react-{name}` if it exists

If `all`, list all packages under `packages/@granit/` and process each.

---

## Step 2 — Gather context

For each target package, collect:

1. **Frontend types**: read `src/types/` and `src/index.ts` (public API surface)
2. **Frontend API functions**: read `src/api/` files
3. **Frontend hooks**: read `src/hooks/` files (for `react-*` packages)
4. **Backend contract** (multi-step discovery):

   a. **Module mapping**: resolve the .NET module name from the package name
   using the naming convention `@granit/{name}` → `Granit.{PascalName}`
   (e.g., `@granit/query-engine` → `Granit.QueryEngine`,
   `@granit/blob-storage` → `Granit.BlobStorage`,
   `@granit/audit-log` → `Granit.AuditLog`).

   b. **Type discovery**: use `mcp__granit-docs__search_code` and
   `mcp__granit-docs__get_public_api` to find the corresponding .NET module
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

   If `roslyn-lens` is unavailable, fall back to `mcp__granit-docs__search_code`
   with queries like `Map{Module}Endpoints`, `MapGet`, `MapPost` in the module
   namespace, then read the endpoint registration file via Read tool.

   d. **Naming convention map**: record the .NET → TypeScript naming for the
   module to verify consistency in Step 3:

   | .NET                                   | TypeScript                              | Convention                                             |
   | -------------------------------------- | --------------------------------------- | ------------------------------------------------------ |
   | Namespace `Granit.{Module}`            | Package `@granit/{kebab-name}`          | PascalCase → kebab-case                                |
   | DTO `{Name}Request` / `{Name}Response` | Type `{Name}Request` / `{Name}Response` | Identical (minus namespace)                            |
   | Endpoint method `Get{Resources}`       | API function `fetch{Resources}`         | Get→fetch, Create→create, Update→update, Delete→delete |
   | Route `/api/{module}/{resource}`       | basePath + `/{resource}`                | Segments match exactly                                 |

5. **Peer dependencies**: read `package.json`
6. **Consumer usage**: if the audit may lead to renaming or removing an exported
   symbol, search for references in consumer apps before flagging:

   ```bash
   grep -r "@granit/{package}" ~/dev/digital-dynamics/guava-platform/applications/guava-front/src/
   grep -r "@granit/{package}" ~/dev/digital-dynamics/guava-platform/applications/guava-admin/src/
   ```

   Record the blast radius (number of import sites) for each exported symbol.

7. **Git history**: for any code that looks unusual, run `git log -p -- <file>`
   to understand why it was written that way before flagging it.

---

## Step 3 — Run the checklist

Apply every category from [checklist.md](checklist.md) against the gathered context.
Work through the checklist **in order** — type conformity first, then API, hooks,
dependencies, and finally cross-cutting concerns.

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

| .NET Endpoint      | Route           | Frontend Function  | Match |
| ------------------ | --------------- | ------------------ | ----- |
| `Get{Resources}`   | `GET /api/...`  | `fetch{Resources}` | OK    |
| `Create{Resource}` | `POST /api/...` | `create{Resource}` | OK    |
| `Update{Resource}` | `PUT /api/...`  | _(none)_           | GAP   |
| ...                | ...             | ...                | ...   |

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
   any consumer (guava-front, guava-admin) — candidate for removal
5. **Pattern uniformity**: verify all domain modules follow the same structure
   (core types package + react hooks package, same file organization)
6. **Cross-package naming consistency**: verify that all packages follow the
   same naming conventions relative to their .NET counterpart:
   - All packages use the same verb mapping (`Get*` → `fetch*`, etc.) — flag
     any package that deviates (e.g., one uses `get*` while others use `fetch*`)
   - All packages use the same DTO naming strategy (no mix of `*Response` and
     `*Result` or `*Dto` across packages for the same pattern)
   - Provider names follow `{Module}Provider` uniformly (not `{Module}Context`
     in some and `{Module}Provider` in others)
   - Query key factories follow the same pattern across all `react-*` packages

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
- Verify **verb mapping**: `Get*` → `fetch*`, `Create*` → `create*`,
  `Update*` → `update*`, `Delete*` → `delete*`
- Verify **route alignment**: URL path built in the function matches the
  .NET route template (same segments, same parameter names)
- Verify **HTTP method** matches the backend endpoint
- Produce the Endpoint Alignment table for the PR report

#### Test coverage

For any new `src/api/*.ts` or `src/hooks/*.ts` file:

- Verify a corresponding test file exists
- If no test: flag as **GAP** with `Action: add test for {function}`

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
- **Respect the monorepo.** Changes to exported types affect guava-front and
  guava-admin. Before proposing any rename or removal, run the consumer grep
  from Step 2.6 and report the blast radius. If > 5 import sites, flag it as
  requiring a coordinated PR.
- **One thing at a time.** Fix one category before moving to the next.
  Don't mix type fixes with hook refactoring in the same pass.
- **Context window discipline.** When auditing `all` packages, process them
  one at a time. Produce the report for each package before moving to the next.
  If you notice the audit becoming shallow (missing details, skipping checks),
  split the remaining packages into a follow-up invocation rather than
  producing a low-quality report.
