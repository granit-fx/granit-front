# CLAUDE.md - Granit Front

> Shared conventions (git, security, personas, issues, DoD, refactoring,
> third-party licenses, markdown): see global `~/.claude/CLAUDE.md`.

## Project

- **Type**: TypeScript/React framework library — 130+ `@granit/*` packages
- **Purpose**: Shared framework for Digital Dynamics front-end applications
- **Equivalent**: JavaScript/TypeScript counterpart of `granit-dotnet`
- **Consumers**: showcase-admin-react (via pnpm `link:` + Vite aliases)

Discover packages: `ls packages/@granit/` — do NOT rely on a hardcoded list.

## Stack & versions

TypeScript 6 (strict, ES2025) | React 19 | Vitest 4 | ESLint 10 |
pnpm workspace | Node 24

## Commands

```bash
pnpm lint               # ESLint (--max-warnings 0)
pnpm tsc                # TypeScript check (pnpm -r exec tsc --noEmit)
pnpm test               # Vitest (all packages, watch mode)
pnpm test:coverage      # Vitest coverage (v8, lcov + html)
pnpm check:csp          # Arch-test: every package using DOM script sinks exposes <pkg>/csp
pnpm --filter @granit/utils lint   # Per package
```

## Package conventions

- **Source-direct (default)**: packages export `.ts` source — no build step,
  no `dist/`, consumed directly via Vite path aliases
- **Published packages (exception)**: a few packages distributed via
  `npm.pkg.github.com` (e.g. `@granit/csp`, `@granit/arch-tests-kit`) ship a
  `tsup` build with `dist/` + `publishConfig`. Keep source-direct unless the
  package is explicitly meant for external publication.
- **Exports**: `"exports": { ".": "./src/index.ts" }` in each `package.json`
- **Entry point**: single `src/index.ts` per package (re-exports public API)
- **Tests**: co-located `src/**/*.test.ts` or `src/__tests__/`
- **Coverage**: >= 80% on new code
- **pnpm only** — never npm or yarn
- **Peer deps**: declared in `peerDependencies`, not `dependencies`
- **No bundling**: consumed directly as TypeScript source via Vite path aliases

### Canonical package structure

**Core package** `@granit/{module}` (framework-agnostic):

```text
{module}/src/
├── __tests__/
├── api/             # Axios calls — required if module exposes HTTP endpoints
├── types/           # DTOs and domain types — directory with index.ts barrel
│                    # (use types/ even when ≤3 types; never types.ts at root)
├── permissions.ts   # Optional — only if module exposes backend permissions
└── index.ts         # Single barrel re-exporting the public API
```

**React package** `@granit/react-{module}` (React-specific):

```text
react-{module}/src/
├── __tests__/
├── components/      # Optional — React components
├── constants.ts     # Optional — small constants (defaults, enums for UI)
├── hooks/           # Required — React Query hooks AND query-key factories
│                    # (query-keys.ts lives here, never in the core package)
├── locales/         # Optional — i18n bundles
├── providers/       # Required when config is consumed via context
├── testing/         # Optional — MSW handlers and test utilities
└── index.ts         # Single barrel re-exporting the public API
```

**Forbidden mixes**:

- No `hooks/` directory in a core `@granit/{module}` package
- No `api/` directory in a `react-{module}` package (hooks live in `hooks/`)
- No `types.ts` flat file at the root of `src/` — always use `types/index.ts`
- No `endpoints/` directory — DTOs go in `types/`

## Coding conventions

Full frontend conventions: `../granit-dotnet/docs/guide/conventions/frontend/`

- `style-et-nommage.md` — TS strict, naming, exports, feature-based org
- `composants.md` — React patterns, shadcn/ui, CVA, Storybook, WCAG
- `etat-et-api.md` — React Query, Orval, auth, routing, i18n, Zod forms

## Tech rules

- **TypeScript strict** — no implicit `any`
- **Logging**: `@granit/logger` (`createLogger`), never `console.log`
- **Imports**: `import type` for type-only imports
- **HTTP calls — Axios vs native `fetch`**:
  - **Business/domain API calls** MUST go through the centralized Axios client
    (`@granit/api-client`) to inherit interceptors (CSRF, auth, tenant headers).
    For streaming endpoints, use `adapter: 'fetch'` with `responseType: 'stream'`.
  - **Native `fetch` is allowed only** in infrastructure layers that sit
    _below_ the Axios client in the dependency graph:
    - `@granit/bff` — auth bootstrap (session check, CSRF token fetch)
    - `@granit/react-bff` — BFF provider initialization
    - Telemetry transports (`@granit/logger-otlp`, `@granit/react-tracing`)
    - Library adapters requiring the Fetch API contract (`@granit/notifications-sse`)
  - **Never add new `fetch()` calls** for domain endpoints — if you need
    streaming or SSE for a business API, route it through Axios.

## API design rules

- **Stability**: exported types/function signatures are consumed by
  showcase-admin-react — breaking changes require coordinating updates
- **No app-specific code**: packages must remain app-agnostic
  (no FHIR, no Capacitor, no admin roles, no HDS-specific behavior)
- **`@granit/authentication` base**: `BaseAuthContextType` is the shared
  base — provider packages extend it, consuming apps extend further
- **Git hooks** (`.husky/`):
  - `commit-msg`: commitlint (Conventional Commits)
  - `pre-commit`: `gitleaks` → `lint-staged` → `tsc -r --noEmit` →
    regenerate `.mcp-front-index.json` when `packages/@granit/*/src/` changed

### Mirroring DTOs from `contracts/openapi/*.json`

The OpenAPI specs are authoritative for **routes, HTTP methods, status codes,
and field names** (PascalCase .NET → camelCase JSON). For **field optionality**,
read the schema's `required` array — NOT the nullability:

- A property's TS optionality (`?`) comes from `required`, never from whether
  it can be `null`. The .NET generator marks **every** positional-record
  parameter **without a C# default** as `required`, because System.Text.Json
  needs the key present to construct the record.
- `string? Foo` (no default) → `required` + `type: ["null","string"]` →
  mirror as **`foo: T | null`** (key required, value nullable), **not** `foo?: T`.
- Only params with a C# default (e.g. `bool X = false`) are absent from
  `required` → **`foo?: T`** (genuinely optional).
- Cross-check the record + FluentValidation validator in
  `granit-dotnet/src/Granit.{Module}.Endpoints/` when in doubt — a missing
  `NotEmpty()`/`NotNull()` rule constrains the _value_, not key presence.

## Refactoring — framework-specific

Any change to public API (`src/index.ts` exports) may break consumers.
Check which apps import the symbol before changing. Never rename exported
symbols without a deprecation notice.

## Architecture tests

Framework-wide conformance lives in dedicated packages — check / extend them
before adding new runtime patterns:

- **`@granit/arch-tests`**: framework-wide suite (e.g. bans `console.*` in
  runtime code, enforces the `createLogger` façade, import boundaries).
- **`@granit/arch-tests-kit`**: reusable helpers consumed by per-package
  arch-tests. Published package — see "Published packages" above.
- **`scripts/check-csp-policies.mjs`** (run via `pnpm check:csp`): any
  `@granit/*` package that writes to a DOM script sink (`.innerHTML`,
  `.outerHTML`, `.insertAdjacentHTML`, `iframe/script.setAttribute('src', …)`,
  direct `.src =` on iframe/script) MUST expose a `<pkg>/csp` subpath with an
  idempotent `installPolicy()` (Trusted Types). Exceptions are hard-coded in
  the script with a justification — add a new exception only as a last resort.

## Code index (`.mcp-front-index.json`)

Pre-commit hook regenerates on `@granit/*` source changes.
Script: `python3 scripts/generate-front-index.py`. **NEVER edit manually.**
