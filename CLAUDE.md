# CLAUDE.md - Granit Front

> Shared conventions (git, security, personas, issues, DoD, refactoring,
> licenses, markdown): global `~/.claude/CLAUDE.md`.

## Project

TypeScript/React framework library (130+ `@granit/*` packages) — shared
front-end framework for Digital Dynamics apps; JS/TS counterpart of
`granit-dotnet`. Consumed by showcase-admin-react via pnpm `link:` + Vite
aliases. Discover packages with `ls packages/@granit/` — never a hardcoded list.

**Stack**: TypeScript 6 (strict, ES2025) · React 19 · Vitest 4 · ESLint 10 ·
pnpm workspace · Node 24.

## Commands

```bash
pnpm lint               # ESLint (--max-warnings 0)
pnpm tsc                # tsc --noEmit (all packages)
pnpm test               # Vitest, watch mode
pnpm test:coverage      # v8 coverage (lcov + html)
pnpm check:csp          # arch-test: DOM-script-sink packages expose <pkg>/csp
pnpm --filter @granit/utils lint   # per package
```

## Package conventions

- **Source-direct (default)**: export `.ts` source, no build/`dist/`, consumed
  via Vite aliases — no bundling.
- **Published (exception)**: a few packages ship a `tsup` build (`dist/` +
  `publishConfig`) via `npm.pkg.github.com` (e.g. `@granit/csp`,
  `@granit/arch-tests-kit`). Keep source-direct unless meant for publication.
- `"exports": { ".": "./src/index.ts" }`; single `src/index.ts` barrel per package.
- Tests co-located: `src/**/*.test.ts` or `src/__tests__/`. Coverage ≥ 80% on new code.
- **pnpm only**. Peer deps in `peerDependencies`, never `dependencies`.

### Canonical structure

**Core** `@granit/{module}` (framework-agnostic): `src/{__tests__/, api/
(Axios calls, if HTTP endpoints), types/ (DTOs+domain, dir w/ index.ts barrel),
permissions.ts (only if backend permissions), index.ts}`.

**React** `@granit/react-{module}`: `src/{__tests__/, components/, constants.ts,
hooks/ (React Query hooks + query-key factories — query-keys.ts lives here, not
core), locales/, providers/ (when config via context), testing/ (MSW handlers),
index.ts}`. hooks/ and providers/ required; rest optional.

**Forbidden**: `hooks/` in a core package · `api/` in a react package · `types.ts`
flat file at `src/` root (always `types/index.ts`) · `endpoints/` dir (DTOs → `types/`).

## Coding conventions

Full frontend conventions: `../granit-dotnet/docs/guide/conventions/frontend/`
— `style-et-nommage.md` (TS strict, naming, exports, feature-org),
`composants.md` (React, shadcn/ui, CVA, Storybook, WCAG),
`etat-et-api.md` (React Query, Orval, auth, routing, i18n, Zod forms).

## Tech rules

- TS strict, no implicit `any`. `import type` for type-only imports.
- Logging via `@granit/logger` (`createLogger`) — never `console.log`.
- **HTTP**: business/domain calls MUST use the centralized Axios client
  (`@granit/api-client`) for interceptors (CSRF, auth, tenant); for streaming use
  `adapter: 'fetch'` + `responseType: 'stream'`. Native `fetch` allowed ONLY in
  infra below the Axios client: `@granit/bff` (auth bootstrap), `@granit/react-bff`
  (provider init), telemetry (`@granit/logger-otlp`, `@granit/react-tracing`),
  Fetch-contract adapters (`@granit/notifications-sse`). Never add new `fetch()`
  for domain endpoints.

## API design rules

- **Stability**: exported types/signatures consumed by showcase-admin-react —
  breaking changes need coordinated updates; never rename exported symbols
  without a deprecation notice (check importing apps first).
- **App-agnostic**: no FHIR/Capacitor/admin-roles/HDS-specific code.
- `@granit/authentication`: `BaseAuthContextType` is the shared base — providers
  extend it, apps extend further.
- **Git hooks** (`.husky/`): `commit-msg` → commitlint (Conventional Commits);
  `pre-commit` → gitleaks → lint-staged → `tsc -r --noEmit` → regenerate
  `.mcp-front-index.json` when `packages/@granit/*/src/` changed.

### Mirroring DTOs from `contracts/openapi/*.json`

Specs are authoritative for routes, HTTP methods, status codes, field names
(PascalCase .NET → camelCase JSON). TS `?` comes from the `required` array, NOT
nullability — these are independent axes:

- `string? Foo` with no C# default → `required` + `type:["null","string"]` →
  **`foo: T | null`** (required key, nullable value). NOT `foo?: T`.
- C#-defaulted param (`bool X = false`) → absent from `required` → **`foo?: T`**.
- Cross-check the FluentValidation validator in `granit-dotnet/src/Granit.{Module}.Endpoints/`.

## Architecture tests

Check/extend before adding new runtime patterns:

- **`@granit/arch-tests`**: bans `console.*` in runtime, enforces `createLogger`,
  import boundaries.
- **`@granit/arch-tests-kit`**: reusable helpers (published — see above).
- **`pnpm check:csp`** (`scripts/check-csp-policies.mjs`): any `@granit/*` writing
  to a DOM script sink (`.innerHTML`, `.outerHTML`, `.insertAdjacentHTML`,
  `iframe/script.setAttribute('src',…)`, `.src=`) MUST expose a `<pkg>/csp`
  subpath with idempotent `installPolicy()` (Trusted Types).

## Code index (`.mcp-front-index.json`)

Pre-commit regenerates on `@granit/*` source changes via
`python3 scripts/generate-front-index.py`. **NEVER edit manually.**
