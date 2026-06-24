# @granit/arch-tests-kit

Reusable **architecture-test primitives** for Digital Dynamics front-end apps —
pure scanner functions that walk source trees and return `Violation[]`. The kit
does the analysis only; you bring your own test runner (Vitest or Jest) and wire
the `describe/it` blocks around each scanner, asserting `toEqual([])`.

This is a **tooling/test** package — framework-agnostic (no React, no DOM, Node
`fs`/`path` only) and one of the few `@granit/*` packages that **ships a `tsup`
build** (`dist/` + `publishConfig` → `npm.pkg.github.com`) so downstream apps can
consume it outside the source-direct workspace. Its reference consumer is the
sibling [`@granit/arch-tests`](../arch-tests), the framework's own self-check
suite that runs every scanner across 200+ packages; that suite is the kit's
primary regression net and catches false positives before app suites hit them.
There is no core/React/react-ui split — a tooling package has none.

## Install

Workspace-internal — `@granit/arch-tests` consumes it via `workspace:*` and the
`@granit/*` Vite/Vitest aliases, so within `granit-front` no extra wiring is
needed. Downstream apps link the (built) package from their own `package.json`:

```json
{
  "devDependencies": {
    "@granit/arch-tests-kit": "link:../granit-front/packages/@granit/arch-tests-kit"
  }
}
```

Vite-based apps with the `@granit/*` auto-alias plugin (or a root Vitest alias)
pick the `link:` symlink up for free — `moduleResolution: bundler` resolves the
package's `exports` to `src/index.ts`, no extra TypeScript config needed. Only if
your test `tsconfig` runs without that alias (plain `tsc`, no bundler resolution)
add a path mapping:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@granit/arch-tests-kit": [
        "../../../granit-front/packages/@granit/arch-tests-kit/src/index.ts",
      ],
    },
  },
}
```

The kit declares **no runtime peer dependencies** — it imports only Node
builtins (`node:fs`, `node:path`). Your test runner (Vitest / Jest) is the only
thing a consumer must provide.

## Quick start

A scanner takes a `ScanContext` (the modules to scan + a `repoRoot` for readable
relative paths) and returns `Violation[]`. An empty array means the rule passes.
One root module covers app-wide scans; one module per feature folder makes
per-feature scans point their violation messages at the right feature.

```ts
// src/__tests__/architecture.test.ts
import fs from 'node:fs';
import path from 'node:path';

import {
  type Module,
  scanComponentNaming,
  scanConsole,
  scanFetch,
  scanHookNaming,
  scanKebabCase,
  scanOnlySkip,
} from '@granit/arch-tests-kit';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '../..');
const SRC = path.resolve(__dirname, '..');

const appModule: Module = { name: 'app', dir: SRC, srcDir: SRC, isReact: true };
const features: Module[] = fs
  .readdirSync(path.join(SRC, 'features'), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => ({
    name: `feature:${e.name}`,
    dir: path.join(SRC, 'features', e.name),
    srcDir: path.join(SRC, 'features', e.name),
    isReact: true,
  }));

const appCtx = { modules: [appModule], repoRoot: REPO_ROOT };
const moduleCtx = { modules: [appModule, ...features], repoRoot: REPO_ROOT };

describe('architecture', () => {
  it('kebab-case file names', () => {
    expect(scanKebabCase(appCtx)).toEqual([]);
  });

  it('no console.* (use createLogger)', () => {
    expect(scanConsole(appCtx)).toEqual([]);
  });

  it('no native fetch()', () => {
    expect(scanFetch(appCtx)).toEqual([]);
  });

  it('no committed .only / .skip', () => {
    expect(scanOnlySkip(appCtx)).toEqual([]);
  });

  it('hooks/use-*.ts export a useXxx symbol', () => {
    expect(scanHookNaming(moduleCtx)).toEqual([]);
  });

  it('components/*.tsx export a PascalCase symbol', () => {
    expect(scanComponentNaming(moduleCtx)).toEqual([]);
  });
});
```

### Customizing

Allowlisted scanners (those taking `AllowlistedScanContext`) accept
`allowedModules` (exempt a whole module) and `allowedFiles` (substring match
against the relative path — exempt one file):

```ts
scanConsole({ ...ctx, allowedModules: ['logger', 'logger-otlp'] });
scanFetch({ ...ctx, allowedFiles: ['src/features/auth/bff-auth-provider.tsx'] });
```

`scanUseClientDirective` is **opt-in by module** — it flags only the modules you
pass in `ctx.modules`, so scope it to the packages a React Server Components app
actually imports. `scanDomScriptSinks`, `scanUndeclaredDeps`, `scanReadmePresence`
and `scanSharedDepVersions` read each module's `package.json` / `csp` entry from
`Module.dir`/`Module.srcDir`; override the lookup with `packageJsonPath` /
`cspSubpath` for non-standard layouts.

## Public API

Every `scan*` function returns `Violation[]`; an empty array passes. `fs` helpers
(`walkSourceFiles`, `isTestFile`, `isTestingDir`, `rel`, `readFile`,
`stripComments`) and the import-collection helpers are exported for building
custom checks.

| Symbol                        | Kind | Purpose                                                                   |
| ----------------------------- | ---- | ------------------------------------------------------------------------- |
| `Module`                      | type | One unit to scan (`name`, `dir`, `srcDir`, `isReact?`)                    |
| `Violation`                   | type | A single finding (`rule`, `module`, `file`, `message`)                    |
| `ScanContext`                 | type | `{ modules, repoRoot }` shared by every scanner                           |
| `AllowlistedScanContext`      | type | `ScanContext` + `allowedModules` / `allowedFiles` exemptions              |
| `walkSourceFiles`             | fn   | Recursively list `.ts`/`.tsx` files (skips `node_modules`, `dist`, …)     |
| `isTestFile` / `isTestingDir` | fn   | Predicates: `*.test.*` / `__tests__/` and `testing/` paths                |
| `rel`                         | fn   | Path relative to `repoRoot` for readable messages                         |
| `readFile`                    | fn   | UTF-8 file read                                                           |
| `stripComments`               | fn   | Drop `//`, `/* */`, JSDoc lines before regex matching                     |
| `collectImports`              | fn   | Extract import/export-from specifiers (comments stripped)                 |
| `hasBannedConsole`            | fn   | Pure predicate: text references the global `console`                      |
| `scanKebabCase`               | fn   | Source file names are kebab-case (allows `.stories.tsx`, `.d.ts`)         |
| `scanHookNaming`              | fn   | Every `hooks/use-*.ts` exports a `useXxx` symbol                          |
| `scanComponentNaming`         | fn   | `components/*.tsx` exports a PascalCase / `createX` / `useX` symbol       |
| `scanFetchVerbInApi`          | fn   | `api/` functions never use the `fetch*` verb (mirrors .NET `get`/`list`)  |
| `scanConsole`                 | fn   | No `console.*` (incl. `globalThis.console`) in runtime code               |
| `scanFetch`                   | fn   | No native `fetch()` — use the centralized Axios client                    |
| `scanAxiosImports`            | fn   | No direct `axios` imports outside the api-client façade                   |
| `scanOnlySkip`                | fn   | No committed `.only` / `.skip` in tests                                   |
| `scanBarrelDefaultExports`    | fn   | No `export default` in module barrels (tree-shaking)                      |
| `scanLeakedInternals`         | fn   | No underscore-prefixed exports leaked from barrels                        |
| `scanLocaleParity`            | fn   | `locales/` ships `en.ts` + `fr.ts` + `index.ts` + `TranslationsEn/Fr`     |
| `scanAnonymousDefaultExports` | fn   | No anonymous `export default` (breaks DevTools labels / stack traces)     |
| `scanWallClockInApi`          | fn   | `api/` never reads the wall clock (`Date.now()` / `new Date()`)           |
| `scanUseFormResolver`         | fn   | Every `useForm()` pairs with a `resolver:` (no silent validation skip)    |
| `scanEmptyCatch`              | fn   | No empty `catch {}` blocks (log, rethrow, or handle)                      |
| `scanReadmePresence`          | fn   | Every module ships a `README.md` whose H1 matches the module name         |
| `scanSharedDepVersions`       | fn   | Curated shared deps use one version constraint across packages            |
| `scanDomScriptSinks`          | fn   | DOM-script-sink packages ship a `<pkg>/csp` subpath (Trusted Types)       |
| `scanUndeclaredDeps`          | fn   | Every bare import is declared in the package's own `package.json`         |
| `scanUseClientDirective`      | fn   | Opt-in: RSC-consumed client-hook files carry `'use client'`               |
| `scanForbiddenStructure`      | fn   | Core no `hooks/components/providers/`; React no `api/`                    |
| `BarrelScanOptions`           | type | `ScanContext` + `barrelFile?` for `scanBarrel*` / `scanLeakedInternals`   |
| `ReadmePresenceOptions`       | type | `scanReadmePresence` options (`expectedHeading?`)                         |
| `SharedDepVersionsOptions`    | type | `scanSharedDepVersions` options (`deps`, `sections?`, `packageJsonPath?`) |
| `DomScriptSinksOptions`       | type | `scanDomScriptSinks` options (`cspSubpath?`)                              |
| `UndeclaredDepsOptions`       | type | `scanUndeclaredDeps` options (`packageJsonPath?`, `ignore?`)              |
| `ForbiddenStructureOptions`   | type | `scanForbiddenStructure` options (`coreForbidden?`, `reactForbidden?`)    |

### `Violation` shape

```ts
interface Violation {
  rule: string; // stable identifier ("kebab-case", "no-console", …)
  module: string; // the Module.name where the violation lives
  file: string; // path relative to ScanContext.repoRoot
  message: string; // human-readable explanation
}
```

Vitest renders the array diff inline — the `file` field is enough for your IDE to
make it clickable.

## Out of scope / caveats

- **No assertions.** Scanners are pure (no `expect`, no file mutation); the caller
  decides how to assert. Keep added scanners pure too — the caller owns the test
  framework.
- **Regex-based, not a full AST.** Scanners match against comment-stripped source
  via bounded regexes (no user input, no ReDoS risk on developer files). They are
  intentionally conservative heuristics, not type-aware analysis.
- **`scanDomScriptSinks` mirrors, does not replace, `scripts/check-csp-policies.mjs`.**
  Inside `granit-front` the canonical CSP gate remains `pnpm check:csp`; the
  scanner lets downstream apps enforce the same Trusted-Types rule from their own
  Vitest suite. A package writing to a DOM-script sink (`.innerHTML`, `.outerHTML`,
  `.insertAdjacentHTML`, `setAttribute('src', …)`) MUST ship a `<pkg>/csp` subpath
  with an idempotent `installPolicy()`.
- **`scanEmptyCatch` ignores `.catch(() => …)` Promise handlers** on purpose —
  `.catch(() => undefined)` is an accepted fire-and-forget idiom (e.g. cache
  invalidation after an already-successful mutation).
- **Adding a scanner:** add the function under `src/scanners/<area>.ts`, re-export
  it from `src/index.ts`, and add coverage in the [`@granit/arch-tests`](../arch-tests)
  suite first — it's the kit's reference user and catches false positives across
  the whole workspace.

## License

Apache-2.0
