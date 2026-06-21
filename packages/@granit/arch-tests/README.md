# @granit/arch-tests

Architecture tests — enforce framework-wide structural, naming, and dependency
conventions across every `@granit/*` package.

This package is the framework's **self-check**: a Vitest suite that runs the pure
scanners from [`@granit/arch-tests-kit`](../arch-tests-kit) against all 130+
packages on every CI run. Linters catch per-file style; these tests catch
cross-package drift — a core package growing a `hooks/` dir, a `fetch*` API
function, a `console.log`, a phantom dependency, a locale missing its French
translation.

It is also the kit's **reference user**: any new scanner is wired here first,
because running against the whole monorepo is the strongest test for
false-positives.

## Layout

```text
src/__tests__/
  helpers.ts           listPackages() — the package inventory + allowlists
  naming.test.ts       kebab-case, hook/component naming, fetch-verb-in-api
  imports.test.ts      console / fetch / axios bans, barrel-bypass, acyclic graph
  barrels.test.ts      no default export / no leaked internals / no .only-.skip
  structure.test.ts    single barrel, no flat types.ts, core/react layering seam
  package-json.test.ts source-direct package.json invariants (exports, peers, …)
  deps.test.ts         no undeclared deps, react-* declares its core sibling
  i18n.test.ts         locales/ parity (en.ts + fr.ts + index.ts + exports)
  csp.test.ts          DOM-script sinks ship a <pkg>/csp subpath
  patterns.test.ts     anonymous default export, wall-clock in api, empty catch…
  uniformity.test.ts   README presence, shared-dep version drift
  use-client.test.ts   'use client' on RSC-consumed client-hook files
```

Most files delegate to a kit scanner (`expect(scanX(ctx)).toEqual([])`).
`structure` and `package-json` keep a few **source-direct-specific** checks
inline (e.g. `exports["."] === ./src/index.ts`, `workspace:*` protocol) that
only apply to framework packages, not to downstream apps.

## Run

```bash
pnpm --filter @granit/arch-tests test        # this suite only
pnpm test                                     # whole workspace (includes it)
```

## Adding a rule

1. Add a pure scanner in
   [`@granit/arch-tests-kit`](../arch-tests-kit/src/scanners) returning
   `Violation[]`, and re-export it from the kit barrel.
2. Wire it here — usually a one-liner delegating to the scanner. Add per-module
   or per-file exemptions through the scanner's allowlist options, never by
   weakening the rule.
3. Reserve inline (non-kit) checks for conventions specific to this monorepo's
   source-direct packaging that have no reuse value downstream.

The arch test packages exclude themselves from the scan (see `EXCLUDED_DIRS` in
`helpers.ts`).
