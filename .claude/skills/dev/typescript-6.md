# TypeScript 6.0 Reference

TypeScript 6.0 (released 2026-03-23) is the **last JavaScript-based release** before
the Go-native TypeScript 7.0. It shifts many defaults to modern values and deprecates
legacy patterns.

---

## New defaults

| Option                         | TS 5.x default           | TS 6.0 default         | Impact                                      |
| ------------------------------ | ------------------------ | ---------------------- | ------------------------------------------- |
| `strict`                       | `false`                  | **`true`**             | All strict checks on by default             |
| `module`                       | `commonjs`               | **`esnext`**           | ESM output by default                       |
| `target`                       | `es5`                    | **`es2025`**           | Assumes evergreen runtimes                  |
| `types`                        | auto-discover `@types/*` | **`[]` (empty)**       | Must explicitly list `@types` packages      |
| `rootDir`                      | inferred from sources    | **`.` (tsconfig dir)** | Set `"rootDir": "./src"` explicitly         |
| `noUncheckedSideEffectImports` | `false`                  | **`true`**             | Side-effect import typos caught             |
| `libReplacement`               | `true`                   | **`false`**            | Fewer failed resolutions, better watch perf |
| `esModuleInterop`              | `false`                  | **always `true`**      | Cannot be set to `false`                    |
| `allowSyntheticDefaultImports` | `false`                  | **always `true`**      | Cannot be set to `false`                    |
| `alwaysStrict`                 | `false`                  | **always `true`**      | Cannot be set to `false`                    |

### `types: []` — biggest migration item

Under TS 6, `@types/*` packages are no longer auto-discovered. You must declare them:

```json
{
  "compilerOptions": {
    "types": ["node", "vite/client"]
  }
}
```

Or restore old behavior with `"types": ["*"]`. The TS team reports **20-50% build time
improvement** from explicit `types`.

### `rootDir` change

Now defaults to the directory containing `tsconfig.json`. If your sources are in `src/`:

```json
{
  "compilerOptions": {
    "rootDir": "./src"
  },
  "include": ["./src"]
}
```

---

## Deprecated options (error by default)

Suppress temporarily with `"ignoreDeprecations": "6.0"` — will NOT work in TS 7.0.

### Removed targets and modules

- **`target: es5`** — minimum is now ES2015
- **`--downlevelIteration`** — irrelevant without ES5
- **`--module amd`**, `umd`, `systemjs`, `none` — use ESM + external bundler
- **`--outFile`** — use external bundler (Vite, Rolldown, esbuild)

### Removed resolution strategies

- **`--moduleResolution node`** (aka `node10`) — use `nodenext` or `bundler`
- **`--moduleResolution classic`** — completely removed

### Removed options

- **`--baseUrl`** — no longer acts as module resolution root. Use full relative paths
  in `paths` instead:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["./src/app/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

### Deprecated syntax

```typescript
// ERROR: legacy module namespace syntax
module Foo {
  export const bar = 10;
}
// FIX: use namespace keyword
namespace Foo {
  export const bar = 10;
}

// ERROR: import assertions
import data from './file.json' assert { type: 'json' };
// FIX: import attributes (with keyword)
import data from './file.json' with { type: 'json' };

// ERROR: no-default-lib directive
/// <reference no-default-lib="true"/>
// FIX: use --noLib or --libReplacement
```

### CLI behavior change

Running `tsc foo.ts` in a directory with `tsconfig.json` now errors. Use:

```bash
tsc --ignoreConfig foo.ts
```

---

## New features

### 1. Less context-sensitive `this`-less functions

Methods without explicit `this` in object literals now participate equally in generic
type inference — no more need to reorder properties:

```typescript
declare function callIt<T>(obj: { produce: (x: number) => T; consume: (y: T) => void }): void;

// Now works regardless of property order
callIt({
  consume(y) {
    y.toFixed();
  },
  produce(x: number) {
    return x * 2;
  },
});
```

### 2. Subpath imports with `#/`

Node.js `#/` prefix supported under `nodenext` and `bundler` resolution:

```json
{
  "imports": {
    "#/*": "./dist/*"
  }
}
```

### 3. `--moduleResolution bundler` + `--module commonjs`

Previously forbidden combination now allowed — migration path from deprecated `node`
resolution.

### 4. `--stableTypeOrdering` flag

Aligns TS 6 type ordering with TS 7.0 deterministic approach. May add ~25% overhead.
Use only for migration testing, not production.

### 5. ES2025 target and lib

New `es2025` target with built-in APIs:

```typescript
// RegExp.escape — safely escape regex chars
const pattern = RegExp.escape('price: $10.00');
// "price\\:\\ \\$10\\.00"

// Promise.try — wrap sync/async in Promise
const result = await Promise.try(() => JSON.parse(input));

// Iterator helpers
const first5 = items.values().take(5).toArray();
const mapped = items.values().map(fn).filter(pred).toArray();

// Set methods
const union = setA.union(setB);
const intersection = setA.intersection(setB);
const difference = setA.difference(setB);
const isSubset = setA.isSubsetOf(setB);
const isSuperset = setA.isSupersetOf(setB);
const isDisjoint = setA.isDisjointFrom(setB);
```

### 6. Temporal API (esnext lib)

```typescript
const now = Temporal.Now.instant();
const today = Temporal.Now.plainDateISO();
const tomorrow = today.add({ days: 1 });
const yesterday = now.subtract({ hours: 24 });

// Duration
const duration = Temporal.Duration.from({ hours: 2, minutes: 30 });
```

### 7. Map/WeakMap upsert methods

```typescript
// Atomic get-or-set
const value = map.getOrInsert('key', defaultValue);

// Lazy computation
const computed = map.getOrInsertComputed('key', () => expensiveCompute());
```

### 8. DOM library consolidation

`lib.dom` now includes `dom.iterable` and `dom.asynciterable` content. No need for
separate `"DOM.Iterable"` in `lib` array.

```json
{
  "compilerOptions": {
    "lib": ["ES2025", "DOM"]
  }
}
```

---

## Migration from TS 5.x to 6.0

### Minimal changes for most projects

1. **Set `types` explicitly:**

   ```json
   "types": ["node"]
   ```

2. **Set `rootDir` if sources are nested:**

   ```json
   "rootDir": "./src"
   ```

3. **Update `baseUrl` + `paths` to full relative paths:**

   ```json
   "paths": { "@app/*": ["./src/app/*"] }
   ```

4. **Replace `import * as` with default imports** (for CJS interop):

   ```typescript
   // Before
   import * as express from 'express';
   // After
   import express from 'express';
   ```

5. **Replace `assert` with `with`** in import attributes:

   ```typescript
   // Before
   import data from './file.json' assert { type: 'json' };
   // After
   import data from './file.json' with { type: 'json' };
   ```

6. **Replace `module` with `namespace`:**

   ```typescript
   // Before
   module Foo {
     export const bar = 10;
   }
   // After
   namespace Foo {
     export const bar = 10;
   }
   ```

### Temporary escape hatch

```json
{
  "compilerOptions": {
    "ignoreDeprecations": "6.0"
  }
}
```

This suppresses deprecation errors but will NOT work in TypeScript 7.0.

### Automated tool

An experimental `ts5to6` CLI can automate `baseUrl` and `rootDir` adjustments:

```bash
npx ts5to6
```

---

## Impact on this project (granit-front)

Current `tsconfig.base.json` settings and TS 6 compatibility:

| Setting                       | Current value                               | TS 6 impact                    |
| ----------------------------- | ------------------------------------------- | ------------------------------ |
| `target: "ES2022"`            | Explicit — overrides new default            | Consider upgrading to `ES2025` |
| `module: "ESNext"`            | Matches new default                         | No change                      |
| `moduleResolution: "bundler"` | Still supported                             | No change                      |
| `strict: true`                | Matches new default                         | No change                      |
| `verbatimModuleSyntax: true`  | Still supported                             | No change                      |
| `jsx: "react-jsx"`            | Unchanged in TS 6                           | No change                      |
| No `types` field              | **Must add** `"types": []` or explicit list | Migration needed               |
| No `rootDir` field            | `noEmit: true` mitigates impact             | Verify if needed               |
| `"DOM.Iterable"` in lib       | Now redundant (included in `"DOM"`)         | Can remove                     |

### Recommended tsconfig.base.json after TS 6 upgrade

```json
{
  "compilerOptions": {
    "target": "ES2025",
    "lib": ["ES2025", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```
