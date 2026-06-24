# @granit/arch-tests

Architecture tests — enforce framework-wide structural, naming, and dependency
conventions across every `@granit/*` package.

This is the framework's **self-check**: a Vitest suite that runs the pure
scanners from [`@granit/arch-tests-kit`](../arch-tests-kit) against all 220+
source-direct packages on every CI run. Linters catch per-file style; these
tests catch cross-package drift — a core package growing a `hooks/` dir, a
`fetch*` API function, a `console.log` (including the `globalThis.console`
bypass), a phantom dependency, a `react-ui` page shipped without a Storybook
story, a locale missing its French translation. It is also the kit's
**reference user**: every new scanner is wired here first, because running
against the whole monorepo is the strongest test for false-positives.

This is a **tooling/test** package, not core or React, and has no backend
counterpart. Its sibling is [`@granit/arch-tests-kit`](../arch-tests-kit) — the
reusable, published scanner kit that does the analysis. This package only
supplies the package inventory, the allowlists, and the `describe/it`
assertions. There is no `react-arch-tests` layer.

## Install

Workspace-internal — there is nothing to import at runtime. The package depends
on [`@granit/arch-tests-kit`](../arch-tests-kit) (`workspace:*`, dev) for the
scanners and on the root `vitest` for the runner. It is part of the workspace
test graph, so `pnpm test` picks it up via the standard `@granit/*` Vitest
aliases — no consumer wiring required.

## Quick start

The suite has **no exported runtime API** — `src/index.ts` is an intentionally
empty barrel that exists only to satisfy the single-`index.ts` convention the
suite itself enforces. You interact with it by running the tests, or by adding a
new rule. A check file delegates to a kit scanner and asserts an empty
`Violation[]`:

```ts
import { scanConsole, scanFetch } from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

import { CONSOLE_ALLOWLIST, FETCH_ALLOWLIST, REPO_ROOT, listPackages, toModules } from './helpers';

const ctx = { modules: toModules(listPackages()), repoRoot: REPO_ROOT };

describe('imports — shared rules (delegated to kit)', () => {
  it('no console.* in runtime code', () => {
    expect(scanConsole({ ...ctx, allowedModules: CONSOLE_ALLOWLIST })).toEqual([]);
  });

  it('no native fetch() outside the infra allowlist', () => {
    expect(scanFetch({ ...ctx, allowedModules: FETCH_ALLOWLIST })).toEqual([]);
  });
});
```

Run it:

```bash
pnpm --filter @granit/arch-tests test   # this suite only
pnpm test                               # whole workspace (includes it)
```

## Check files

Each file under `src/__tests__/` owns one convention family. Most delegate to a
kit scanner (`expect(scanX(ctx)).toEqual([])`); `structure` and `package-json`
keep a few **source-direct-specific** checks inline (e.g.
`exports["."] === ./src/index.ts`, `workspace:*` protocol, no `main`/`module`/
`types`) that apply to framework packages, not to downstream apps.

| File                   | Enforces                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| `helpers.ts`           | `listPackages()` inventory + the allowlists/ratchets below            |
| `naming.test.ts`       | kebab-case dirs, hook/component naming, no `fetch*` verb in `api/`    |
| `imports.test.ts`      | console / fetch / axios bans, barrel-bypass, acyclic `@granit` graph  |
| `barrels.test.ts`      | no default export, no leaked internals, no `.only` / `.skip`          |
| `structure.test.ts`    | single barrel, no flat `types.ts`, core/react seam, Storybook ratchet |
| `package-json.test.ts` | source-direct `package.json` invariants (exports, peers, protocol)    |
| `deps.test.ts`         | no undeclared deps, `react-*` declares its core sibling               |
| `i18n.test.ts`         | `locales/` parity (`en.ts` + `fr.ts` + `index.ts` + exports)          |
| `csp.test.ts`          | DOM-script sinks ship a `<pkg>/csp` subpath                           |
| `patterns.test.ts`     | anonymous default export, wall-clock in `api/`, empty `catch`         |
| `uniformity.test.ts`   | README presence, shared-dep version drift                             |
| `use-client.test.ts`   | `'use client'` on RSC-consumed client-hook files                      |

## Public API

The barrel exports nothing. The package's real surface is `helpers.ts`, whose
inventory and allowlist constants the check files import locally.

| Symbol                           | Kind  | Purpose                                                                                                  |
| -------------------------------- | ----- | -------------------------------------------------------------------------------------------------------- |
| `listPackages()`                 | fn    | Scan `packages/@granit`, parse each `package.json` to `PackageInfo[]` (self-excludes both arch packages) |
| `toModules(pkgs)`                | fn    | Project `PackageInfo[]` into the kit's `Module` shape                                                    |
| `PackageInfo`                    | type  | `Module` + `dirName`, `packageJsonPath`, parsed `packageJson`                                            |
| `REPO_ROOT` / `PACKAGES_DIR`     | const | Resolved monorepo + `packages/@granit` absolute paths                                                    |
| `FETCH_ALLOWLIST`                | const | Packages allowed native `fetch()` (infra below axios)                                                    |
| `AXIOS_ALLOWLIST`                | const | Packages allowed to import `axios` directly (`api-client`)                                               |
| `CONSOLE_ALLOWLIST`              | const | Packages allowed `console.*` (logger + transports)                                                       |
| `RSC_PACKAGES`                   | const | Packages consumed by the Next.js RSC app (`'use client'` rule)                                           |
| `REACT_ECOSYSTEM_CORE_ALLOWLIST` | const | Core packages still importing the React ecosystem (debt)                                                 |
| `UI_ROUTER_BASELINE`             | const | `react-ui-*` packages importing a web router (shrinking ratchet)                                         |
| `STORYBOOK_PAGE_BUDGET`          | const | Per-package storyless page/dialog budget (shrinking ratchet)                                             |
| `LOGGER_MULTI_INSTANCE_BASELINE` | const | Packages allowed >1 `createLogger()` (currently empty)                                                   |

Scanners (`scanConsole`, `scanFetch`, `scanForbiddenStructure`,
`scanLocaleParity`, `scanDomScriptSinks`, …) are not owned here — they are
imported from [`@granit/arch-tests-kit`](../arch-tests-kit) and wired by the
check files. Allowlists marked *ratchet* are frozen baselines: no NEW package
may join, and the list should only ever shrink.

## Adding a rule

1. Add a pure scanner in
   [`@granit/arch-tests-kit`](../arch-tests-kit/src/scanners) returning
   `Violation[]`, and re-export it from the kit barrel.
2. Wire it here — usually a one-liner delegating to the scanner. Add per-module
   or per-file exemptions through the scanner's allowlist options or a ratchet
   constant in `helpers.ts`, never by weakening the rule.
3. Reserve inline (non-kit) checks for conventions specific to this monorepo's
   source-direct packaging that have no reuse value downstream.

## Out of scope / caveats

- **Per-file style** (formatting, unused imports, single-file lint rules) is
  ESLint's job; this suite only catches **cross-package** structural drift.
- **No runtime export.** Importing `@granit/arch-tests` gets you an empty
  module — depend on [`@granit/arch-tests-kit`](../arch-tests-kit) if you want
  the scanners in another suite.
- **Self-exclusion.** Both `arch-tests` and `arch-tests-kit` are skipped by
  `listPackages()` (see `EXCLUDED_DIRS` in `helpers.ts`), so the suite never
  scans itself.
- **Ratchet baselines drift with `develop`.** Regenerate `UI_ROUTER_BASELINE`,
  `STORYBOOK_PAGE_BUDGET`, and the other frozen lists from the merge base
  (`origin/develop`), not the live shared worktree, or CI will flip on stale
  counts.

## License

Apache-2.0
