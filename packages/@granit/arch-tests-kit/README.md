# @granit/arch-tests-kit

Reusable architecture-test primitives for Digital Dynamics front-end apps.
Pure scanner functions that return `Violation[]` — bring your own test runner.

## Why

Every DD app shares conventions: kebab-case filenames, `hooks/use-*.ts`,
no `console.*` in runtime code, no direct `axios` imports, no committed
`.only`. This kit lets each app enforce them mechanically with ~40 lines
of Vitest, without copy-pasting AST regexes across repos.

Used in production by [`@granit/arch-tests`](../arch-tests) (framework
self-check) and [`granit-showcase-admin-react`](https://github.com/granit-fx/granit-showcase-admin-react).

## Install

While the framework is consumed source-direct, link the kit from your
app's `package.json`:

```json
{
  "devDependencies": {
    "@granit/arch-tests-kit": "link:../granit-front/packages/@granit/arch-tests-kit"
  }
}
```

Add a TypeScript path mapping in your test `tsconfig`:

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

Vite-based apps with the `@granit/*` auto-alias plugin pick it up for free.

## Quick start

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

// One root module covers app-wide scans (kebab-case, console, fetch).
// One module per feature folder makes per-feature scans (hooks, components)
// produce violation messages that point at the right feature.
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

  it('no console.*', () => {
    expect(scanConsole(appCtx)).toEqual([]);
  });

  it('no native fetch()', () => {
    expect(scanFetch(appCtx)).toEqual([]);
  });

  it('no committed .only / .skip', () => {
    expect(scanOnlySkip(appCtx)).toEqual([]);
  });

  it('hooks/use-*.ts exports a useXxx symbol', () => {
    expect(scanHookNaming(moduleCtx)).toEqual([]);
  });

  it('components/*.tsx exports a PascalCase symbol', () => {
    expect(scanComponentNaming(moduleCtx)).toEqual([]);
  });
});
```

A complete reference setup lives in
[`granit-showcase-admin-react/src/__tests__/architecture.test.ts`](https://github.com/granit-fx/granit-showcase-admin-react/blob/develop/src/__tests__/architecture.test.ts).

## Available scanners

| Scanner                    | Rule                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `scanKebabCase`            | Source files use kebab-case (allows `.stories.tsx`, `.d.ts`)                             |
| `scanHookNaming`           | Every `hooks/use-*.ts` exports a `useXxx` symbol                                         |
| `scanComponentNaming`      | Every `components/*.tsx` exports a PascalCase / `createX` / `useX` symbol                |
| `scanFetchVerbInApi`       | `api/` functions never use the `fetch*` verb                                             |
| `scanConsole`              | No `console.*` in runtime code                                                           |
| `scanFetch`                | No native `fetch()` calls                                                                |
| `scanAxiosImports`         | No direct `axios` imports                                                                |
| `scanOnlySkip`             | No committed `.only` / `.skip` in tests                                                  |
| `scanBarrelDefaultExports` | No `export default` in module barrels                                                    |
| `scanLeakedInternals`      | No underscore-prefixed exports leaked from barrels                                       |
| `scanLocaleParity`         | `locales/` ships `en.ts` + `fr.ts` + `index.ts` + matching `TranslationsEn/Fr` constants |
| `scanDomScriptSinks`       | Any package writing to a DOM-script sink ships a `<pkg>/csp` subpath (Trusted Types)     |
| `scanUndeclaredDeps`       | Every bare import is declared in the package's own `package.json` (no phantom deps)      |
| `scanUseClientDirective`   | RSC-consumed modules mark every client-hook file with `'use client'` (opt-in)            |

All scanners return `Violation[]`. Empty array means the rule passes.

## Customizing

### Skip rules per module

```ts
scanConsole({
  ...ctx,
  allowedModules: ['logger', 'logger-otlp'], // these may use console.*
});
```

### Skip rules per file

Use `allowedFiles` (substring match against the relative path) for
one-off exceptions:

```ts
scanFetch({
  ...ctx,
  allowedFiles: ['src/features/auth/bff-auth-provider.tsx'],
});
```

Available on `scanKebabCase`, `scanConsole`, `scanFetch`, `scanAxiosImports`.

### Nested layouts

`scanHookNaming`, `scanComponentNaming`, and `scanFetchVerbInApi` walk
**recursively** under each module's `srcDir`, so they find every
`hooks/` / `components/` / `api/` subdir regardless of depth — the same
rule works for a flat package and a feature-folder app.

### Opt-in scanners

`scanUseClientDirective` is **opt-in by module**: it flags only the modules
you pass in `ctx.modules`. Scope it to the packages a React Server Components
app actually imports — server-only modules never need the directive:

```ts
const rsc = new Set(['@granit/react-cms']);
scanUseClientDirective({ ...ctx, modules: ctx.modules.filter((m) => rsc.has(m.name)) });
```

`scanDomScriptSinks` and `scanUndeclaredDeps` read each module's
`package.json`/`src/csp/index.ts` from `Module.dir`/`Module.srcDir`. Override
the lookup with `packageJsonPath` / `cspSubpath` for non-standard layouts.

## Violation shape

```ts
interface Violation {
  rule: string; // stable identifier ("kebab-case", "no-console", ...)
  module: string; // the Module.name where the violation lives
  file: string; // path relative to ScanContext.repoRoot
  message: string; // human-readable explanation
}
```

Vitest renders the array diff inline — the `file` field is enough for
your IDE to make it clickable.

## Adding a new scanner

1. Add a function in
   [`src/scanners/<area>.ts`](src/scanners) returning `Violation[]`.
2. Re-export it from [`src/index.ts`](src/index.ts).
3. Add coverage in the framework's
   [`@granit/arch-tests`](../arch-tests) suite first — it's the kit's
   reference user, and it catches false-positives across 120+ packages.

Keep scanners pure (no `expect`, no file mutation). The caller decides
how to assert.
