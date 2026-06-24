# @granit/storage

Typed `localStorage` / `sessionStorage` wrapper — a `createStorage` factory that
adds compile-time value types, JSON serialization, and an automatic `dd:` key
prefix on top of the Web Storage API.

This is a framework-agnostic **core** package: it has no React, DOM-framework or
Node dependency and no peer dependencies. It targets the browser Web Storage API
only (`localStorage` / `sessionStorage`). The React binding — a
`useSyncExternalStore`-based `useStorage` hook with cross-tab synchronization —
lives one layer up in [`@granit/react-storage`](../react-storage); there is no
`react-ui` admin feature kit. There is no backend counterpart: this is purely a
client-side persistence utility, unrelated to the remote-file
[`@granit/blob-storage`](../blob-storage) family.

This package ships a `tsup` build (`dist/` + `publishConfig`) and is one of the
few `@granit/*` packages published to `npm.pkg.github.com` rather than consumed
source-direct.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases (or the
`link:` protocol), not published for app consumption through a public registry.
There are **no peer dependencies** to declare: the package depends only on the
ambient browser Web Storage globals.

## Quick start

`createStorage<T>(key, options?)` returns a small typed accessor. The stored key
is always prefixed with `dd:` to avoid collisions with third-party libraries, and
values round-trip through `JSON.stringify` / `JSON.parse` by default.

```ts
import { createStorage } from '@granit/storage';

// Typed accessor over localStorage key "dd:theme".
const themeStorage = createStorage<'light' | 'dark'>('theme');

themeStorage.set('dark');     // writes "\"dark\"" to localStorage["dd:theme"]
themeStorage.get();           // 'dark' (or null if absent / unparseable)
themeStorage.key;             // 'dd:theme'
themeStorage.remove();        // deletes the key
```

Objects work the same way, and reads are defensive — a missing key or corrupted
JSON yields `null` instead of throwing:

```ts
const sidebar = createStorage<{ open: boolean }>('sidebar');
sidebar.set({ open: true });
sidebar.get();                // { open: true }
```

Opt into `sessionStorage`, or supply a custom (de)serializer for non-JSON values
such as `Date`:

```ts
const draft = createStorage<{ body: string }>('draft', { storage: 'session' });

const lastSeen = createStorage<Date>('last-seen', {
  serialize: (d) => d.toISOString(),
  deserialize: (raw) => new Date(raw),
});
```

For React state synchronized with storage (tear-free reads, cross-tab updates),
use `useStorage` from [`@granit/react-storage`](../react-storage) instead of
calling the accessor in render.

## Public API

| Symbol              | Kind | Purpose                                                             |
| ------------------- | ---- | ------------------------------------------------------------------- |
| `createStorage<T>`  | fn   | Build a typed accessor for one prefixed key (`dd:` + your key)      |
| `StorageOptions<T>` | type | Optional `serialize`/`deserialize`/`storage` (`local`/`session`)    |
| `TypedStorage<T>`   | type | Accessor shape: `get()`, `set()`, `remove()`, readonly `key`        |

`TypedStorage<T>` members:

- `get(): T | null` — read and deserialize, or `null` if the key is absent or the
  stored value fails to parse.
- `set(value: T): void` — serialize and write.
- `remove(): void` — delete the prefixed key.
- `key: string` — the resolved, prefixed backend key (e.g. `dd:theme`).

## Caveats

- **Browser-only.** The factory reads `localStorage` / `sessionStorage` directly
  with no SSR/Node guard; calling `get` / `set` / `remove` outside a browser
  throws. Drive UI state through the `useStorage` hook in
  [`@granit/react-storage`](../react-storage), which is built for the React
  lifecycle.
- **Silent read failures.** `get()` swallows `JSON.parse` errors (and any backend
  read error) and returns `null` — there is no way to distinguish "absent" from
  "corrupted". This is intentional for resilience; do not store data here that a
  silent reset would corrupt.
- **No quota / write-error handling.** `set()` does not catch
  `QuotaExceededError` or private-mode write failures; the underlying Web Storage
  exception propagates to the caller.
- **Not for secrets or PII.** Web Storage is readable by any script on the origin
  and persists on disk; never store tokens, secrets, or personal data here.
  Authentication state belongs to the BFF / `@granit/api-client`, not this
  utility.
- **Fixed `dd:` prefix.** The prefix is not configurable; the literal key you pass
  is namespaced under `dd:` to avoid third-party collisions.

Part of the [Granit](https://granit-fx.dev) framework — see the
[full documentation](https://granit-fx.dev/frontend/data/storage/).

## License

Apache-2.0
