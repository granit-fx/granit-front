---
name: perf
description: 'Performance & scalability engineer: audit @granit/* packages for high-scale readiness — request cancellation, list virtualization, pagination strategy, cache hygiene, bundle/tree-shaking, and real-time transport efficiency. Complements /audit (backend conformity) and /quality (lint, tests, SonarQube).'
argument-hint: '[<package> | all | pr] [--fix] [--scope data|render|cache|bundle|realtime|all]'
---

# Performance & Scalability Audit — Granit Front

You are a **performance engineer** specialized in high-scale React/TypeScript
front-ends. Your mission: audit `@granit/*` packages for patterns that are fine
at small scale but **degrade, leak, or freeze** when the dataset, the request
rate, the user count, or the package graph grows large — the issues that
conformity checks (`/audit`) and linters (`/quality`) do not catch.

Read [checklist.md](checklist.md) before proceeding.
**If the file cannot be read, STOP and report the error.** Do not attempt to
audit without the checklist — it contains the full scale-readiness matrix.

**Absolute minimum rules** (in case checklist is partially loaded):

1. Every list/table/gallery that can render an unbounded or infinite-scroll
   dataset MUST virtualize (`@tanstack/react-virtual`) — never a raw `.map()`
   over the whole array
2. Every `src/api/` function MUST accept and forward an `AbortSignal` (axios
   `{ signal }`) so superseded requests are cancelled
3. High-cardinality / unbounded lists use **cursor** pagination (`nextCursor`),
   not offset — offset degrades server-side as the page number grows
4. Paginated params go through `validateQueryRequest` / `serializeQueryRequest`
   (clamped to server limits) — never hand-built unbounded params
5. **Evidence over intuition**: back every finding with a concrete scale scenario
   (N rows, M req/s, bundle KB). Never flag "could be faster" without a number

---

## Relationship to other skills

| Skill       | Answers                                                    |
| ----------- | ---------------------------------------------------------- |
| `/perf`     | Will this hold up at high scale? (this skill)              |
| `/audit`    | Does this match the .NET backend contract and conventions? |
| `/quality`  | Lint, format, tests, SonarQube quality gate                |
| `/security` | Is this safe? (XSS, IAM, CSP, supply chain)                |

Do not duplicate `/audit` or `/quality` findings here. If a scale issue is also
a conformity issue (e.g. unbounded params that bypass `validateQueryRequest`),
flag it here through the **scale** lens (load amplification) and let `/audit`
own the conformity angle.

---

## Invocation modes

| Argument          | Scope                                                   |
| ----------------- | ------------------------------------------------------- |
| `help`            | Show available commands, flags, and examples            |
| _(none)_ or `all` | Full scale audit across all `@granit/*` packages        |
| `<package>`       | Single package (e.g., `query-engine`, `react-entities`) |
| `pr`              | Scale audit of only the packages touched by the branch  |

### Flags

| Flag               | Effect                                                |
| ------------------ | ----------------------------------------------------- |
| `--fix`            | Apply safe fixes automatically (default: report only) |
| `--scope data`     | Data fetching: cancellation, pagination, N+1          |
| `--scope render`   | Rendering: virtualization, debounce, memoization      |
| `--scope cache`    | TanStack Query cache hygiene and invalidation         |
| `--scope bundle`   | Tree-shaking, code-splitting, dependency weight       |
| `--scope realtime` | SSE / SignalR transports, polling, subscriptions      |
| `--scope all`      | Full scale audit (default)                            |
| `--base <branch>`  | Base branch for `pr` mode (default: `develop`)        |

### Help (`/perf help`)

If the argument is `help`, output the following reference card and **stop**
(do not run any audit):

```text
/perf — Scalability & performance audit for @granit/* packages

USAGE
  /perf [target] [flags]

TARGETS
  help              Show this help
  all               Full scale audit — all packages (default)
  pr                PR mode — only packages changed vs develop
  <package>         Single package (e.g., query-engine, react-entities)

FLAGS
  --fix             Apply safe fixes automatically (default: report only)
  --scope <scope>   Limit audit to a category:
                      data      Cancellation, pagination, N+1 fetches
                      render    Virtualization, debounce, memoization
                      cache     Query cache hygiene and invalidation
                      bundle    Tree-shaking, code-splitting, dep weight
                      realtime  SSE/SignalR, polling, subscriptions
                      all       Everything (default)
  --base <branch>   Base branch for pr mode (default: develop)

EXAMPLES
  /perf                          Full scale audit, report only
  /perf react-entities           Audit one package for scale readiness
  /perf react-entities --fix     Audit and apply safe fixes
  /perf pr                       Check packages modified in current branch
  /perf all --scope render       Only check rendering/virtualization
  /perf query-engine --scope data   Only check data-fetching scale patterns

SEVERITY (scale impact)
  CRITICAL    Unbounded resource use — freezes/fails at high scale
  HIGH        Superlinear cost or load amplification
  MEDIUM      Avoidable overhead per interaction
  LOW         Micro-optimization — consider

RELATED SKILLS
  /audit      Backend conformity + cross-package conventions
  /quality    Lint, format, tests, SonarQube
```

---

## Step 1 — Identify target packages

If a specific package was given, resolve it (same rule as `/audit`):

- `query-engine` → `packages/@granit/query-engine` + `packages/@granit/react-query-engine`
- Any name → `packages/@granit/{name}` + `packages/@granit/react-{name}` if it exists

If `all`, list packages under `packages/@granit/` and prioritize the ones most
exposed to scale: anything with `src/components/` rendering lists, anything with
`src/api/` (data load), and the transport packages (`notifications-*`).

---

## Step 2 — Gather context (evidence-first)

Performance findings must be grounded in code, not guessed. For each target,
collect the following with concrete recipes:

**Request cancellation** — which api functions never accept a signal:

```bash
# api files that DON'T thread an AbortSignal (each is a candidate finding)
grep -L "AbortSignal\|signal" packages/@granit/{pkg}/src/api/*.ts 2>/dev/null
```

**Unvirtualized large lists** — `.map()` render over query data with no virtualizer:

```bash
grep -rln "\.map(" packages/@granit/{pkg}/src/components/ 2>/dev/null
grep -rL "useVirtualizer\|react-virtual" packages/@granit/{pkg}/src/components/ 2>/dev/null
```

**Pagination strategy** — offset vs cursor for the module's lists:

```bash
grep -rnE "nextCursor|cursor|offset|\bskip\b|page\b" packages/@granit/{pkg}/src/ 2>/dev/null
```

**Client-side N+1** — awaited calls inside loops:

```bash
grep -rnE "for *\(.*await|\.map\(async|Promise\.all\(.*map" packages/@granit/{pkg}/src/ 2>/dev/null
```

**Cache invalidation breadth** — argument-less invalidation = refetch storm:

```bash
grep -rn "invalidateQueries()" packages/@granit/{pkg}/src/ 2>/dev/null
```

**Tree-shaking** — packages missing `sideEffects`:

```bash
grep -L '"sideEffects"' packages/@granit/{pkg}/package.json 2>/dev/null
```

**Debounce on inputs** — search/filter components firing per keystroke:

```bash
grep -rln "onChange\|onValueChange" packages/@granit/{pkg}/src/components/ 2>/dev/null
grep -rL "debounce\|throttle" packages/@granit/{pkg}/src/components/ 2>/dev/null
```

Then read the flagged files fully before judging. Run `git log -p -- <file>` for
anything that looks intentionally written that way (a deliberate non-virtualized
list capped at N items is fine — read the cap before flagging).

---

## Step 3 — Run the checklist

Apply every category from [checklist.md](checklist.md) against the gathered
context, **in order**: data fetching, rendering, cache, bundle, real-time, then
the cross-cutting concurrency checks.

For each finding, classify it by **scale impact**:

| Severity     | Meaning                                             | Action         |
| ------------ | --------------------------------------------------- | -------------- |
| **CRITICAL** | Unbounded resource use; freezes/fails at high scale | Must fix       |
| **HIGH**     | Superlinear cost or server-side load amplification  | Should fix     |
| **MEDIUM**   | Avoidable overhead on every interaction             | Should improve |
| **LOW**      | Micro-optimization with measurable but small gain   | Consider       |

Every finding MUST state the **scale scenario** that triggers it — the number
that makes it matter (e.g. "freezes at ~5k rows", "fires 1 req/keystroke =
~8 req/word", "+40 KB unconditionally in every consumer bundle").

---

## Step 4 — Report or fix

### Report mode (default)

```markdown
## Scale Audit — @granit/{package} — {date}

### Scale budget

| Dimension                | Target              | Observed        | Verdict |
| ------------------------ | ------------------- | --------------- | ------- |
| Largest rendered list    | virtualized         | {virtualized?}  | OK/RISK |
| Requests per interaction | ≤ 1 (cancellable)   | {observed}      | OK/RISK |
| Pagination strategy      | cursor for big sets | {offset/cursor} | OK/RISK |
| Tree-shakeable           | sideEffects: false  | {yes/no}        | OK/RISK |

### Summary

| Severity | Count |
| -------- | ----- |
| CRITICAL | {n}   |
| HIGH     | {n}   |
| MEDIUM   | {n}   |
| LOW      | {n}   |

### CRITICAL

- [{file}:{line}] {description}
  Scale scenario: {the number that makes it break}
  Current: {what the code does}
  Fix: {concrete change — API + reference to the framework primitive}

### HIGH / MEDIUM / LOW

(same format)
```

When auditing `all`, produce one report per package, then a **cross-package
scale summary**: systemic gaps (e.g. "0/146 packages set `sideEffects`",
"N api functions thread no signal") with counts.

### Fix mode (`--fix`)

Apply only **safe, mechanical** fixes — process findings one at a time:

- **Safe to auto-fix**: add `"sideEffects": false` to a package with no
  module-level side effects; thread an existing `signal` param into an axios
  call; add `staleTime` to a metadata query; replace `invalidateQueries()` with
  a scoped key.
- **NEVER auto-fix** (report only): introducing virtualization (changes markup
  and UX), changing pagination from offset to cursor (backend coordination),
  code-splitting boundaries. These need human design — flag with a concrete
  proposal instead.

After each fix run `pnpm --filter @granit/{package} exec tsc --noEmit`. Two
attempts max per finding; on second failure, revert and log
`UNFIXABLE — manual: {error}`. After all fixes:

```bash
pnpm tsc && pnpm lint && npx vitest run
```

If a check fails on code you did not touch, **stop and report** — never fix
pre-existing failures outside scope.

---

## Step 5 — Cross-package scale analysis (full audit only)

1. **Virtualization coverage**: list every component rendering a query-backed
   collection and whether it virtualizes. `@tanstack/react-virtual` is in the
   approved dependency set — flag list components that don't use it.
2. **Cancellation coverage**: ratio of `src/api/` functions that thread a signal
   vs total. Report the gap.
3. **Bundle hygiene**: count packages missing `"sideEffects": false`; flag heavy
   optional deps (editors, charting, PDF) that are statically imported instead of
   `lazy()` / dynamic `import()`.
4. **Shared scale primitives**: verify packages reuse `usePagination` /
   `useInfiniteScroll` / `validateQueryRequest` from `@granit/*query-engine`
   rather than reinventing unbounded variants.
5. **Real-time fan-out**: verify transport packages share a single connection per
   client (not one per subscribing component) and coalesce high-frequency events.

---

## PR Mode (`/perf pr`)

Focused scale audit of only the packages modified in the current branch — run it
before merging a feature that adds lists, data fetching, or dependencies.

### PR Step 1 — Determine scope

```bash
git fetch origin develop --quiet
git diff origin/develop...HEAD --name-only
```

If on `develop`/`main`: **"Nothing to audit — you're on the base branch."** and
stop. Extract affected `@granit/*` packages; if none, **"No framework packages
modified."** and stop.

### PR Step 2 — Scale-sensitive diff review

For the diff in each affected package, check:

- **New list render**: any added `.map()` in a component over query data →
  does it virtualize? (CRITICAL if unbounded)
- **New api function**: does it accept and forward an `AbortSignal`? Does it use
  cursor pagination for a high-cardinality resource?
- **New mutation**: does `onSuccess` invalidate a scoped key (not `()`)?
- **New dependency**: weight and whether it should be `lazy()`-loaded; is the
  package still tree-shakeable (`sideEffects`)?
- **New input**: search/filter/autocomplete debounced before firing a query?

### PR Step 3 — Verdict

```bash
pnpm tsc && pnpm lint && npx vitest run
```

```markdown
## PR Scale Audit — {branch} → develop — {date}

### Packages touched

- @granit/{pkg} ({n} files)

### Findings

| Severity | Count |
| -------- | ----- |
| CRITICAL | {n}   |
| HIGH     | {n}   |
| MEDIUM   | {n}   |

{findings — same format as standard report}

### Verdict

SCALE-READY | BLOCKED — {reasons}
```

---

## Rules

- **Read before judging.** A non-virtualized list capped at a small fixed N is
  fine — read the cap and the data source before flagging. Run `git log -p`
  on anything that looks deliberately written that way.
- **Numbers, not vibes.** Every finding names the scale at which it bites. No
  number → not a finding. "Premature optimization" is itself a smell; don't add
  complexity the data doesn't justify.
- **Respect source-direct consumption.** These packages ship TS source consumed
  via Vite path aliases — the consuming app's bundler does the tree-shaking.
  Frame bundle findings in terms of what reaches the _app_ bundle, not a
  per-package `dist/`.
- **Don't fight the backend.** Pagination clamping and limits live in
  `query-engine` / the .NET QueryEngine. Reuse them; never propose a frontend
  workaround that bypasses a server-enforced limit.
- **One dimension at a time.** Finish data-fetching findings before rendering,
  rendering before cache, etc. Don't interleave categories in one pass.
- **Context window discipline.** For `all`, process packages one at a time and
  emit each report before the next. If the audit goes shallow, split into a
  follow-up rather than producing a low-signal report.
