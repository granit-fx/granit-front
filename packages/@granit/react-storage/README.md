# @granit/react-storage

React bindings for the Granit **browser storage** primitive — a single
`useStorage` hook that binds component state to `localStorage` /
`sessionStorage` with tear-free reads and cross-tab synchronization.

This is the **React hooks layer**: it wraps the framework-agnostic
[`@granit/storage`](../storage) accessor (`createStorage`, typed
get/set/remove over a `dd:`-prefixed key with JSON serialization) in a
`useSyncExternalStore`-backed hook so a component re-renders whenever the stored
value changes, including from another browser tab. There is no domain backend,
no DTO, and no `react-ui-storage` admin kit — this package is purely a client-
side persistence helper. (The unrelated `@granit/blob-storage` /
[`@granit/react-blob-storage`](../react-blob-storage) family covers server-side
binary file storage and is a different domain.)

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/storage` — the framework-agnostic core (`createStorage`,
  `StorageOptions`) this hook wraps.
- `react` (`^19`) — provides `useSyncExternalStore`.

No `@granit/api-client`, `axios`, or TanStack Query peer: nothing here touches
the network.

## Quick start

`useStorage` mirrors `useState`'s tuple shape but persists the value and keeps
every tab in sync. The first generic argument is the value type; `defaultValue`
is returned when the key is absent or its stored JSON is corrupt.

```tsx
import { useStorage } from '@granit/react-storage';

function ThemeSelector() {
  // Persisted under localStorage key "dd:app.theme" (the `dd:` prefix is
  // applied by @granit/storage to avoid third-party key collisions).
  const [theme, setTheme] = useStorage('app.theme', 'light');

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
```

Objects work as long as they are JSON-serializable, and `sessionStorage` is
selected via `options.storage`. Custom `serialize` / `deserialize` cover non-JSON
shapes (e.g. `Date`) — they **must** be referentially stable (defined outside the
component or memoized), since the hook only rebuilds its accessor when `key` or
the `storage` backend changes:

```tsx
import { useStorage } from '@granit/react-storage';

// Stable across renders — declare serializers at module scope.
const toIso = (d: Date) => d.toISOString();
const fromIso = (raw: string) => new Date(raw);

function Sidebar() {
  const [state, setState] = useStorage('sidebar', { open: false }); // sessionStorage via { storage: 'session' }
  const [seenAt, setSeenAt] = useStorage<Date>('seen-at', new Date(), {
    serialize: toIso,
    deserialize: fromIso,
  });

  return (
    <nav data-open={state.open}>
      <button type="button" onClick={() => setState({ open: !state.open })}>
        Toggle
      </button>
      <button type="button" onClick={() => setSeenAt(new Date())}>
        Seen {seenAt.toISOString()}
      </button>
    </nav>
  );
}
```

## Public API

| Symbol       | Kind | Purpose                                                      |
| ------------ | ---- | ------------------------------------------------------------ |
| `useStorage` | hook | `[value, setValue]` bound to web storage, synced across tabs |

`useStorage<T>(key, defaultValue, options?)` takes the core
`StorageOptions<T>` from [`@granit/storage`](../storage) (`storage:
'local' \| 'session'`, custom `serialize` / `deserialize`) and returns a
`[T, (value: T) => void]` tuple. `setValue` writes through the typed accessor
and dispatches a same-tab `StorageEvent`, so other `useStorage` instances on the
same key update immediately; cross-tab updates arrive via the browser's native
`storage` event.

## Caveats

- **Stable option callbacks.** `serialize` / `deserialize` must keep a stable
  reference across renders. The accessor is memoized on `key` and the `storage`
  backend only — passing freshly-created option closures every render will not
  re-wire the serializers and may surprise you.
- **Default value on corrupt / missing data.** A missing key or unparseable
  JSON resolves to `defaultValue` (the core accessor returns `null` and the hook
  substitutes the default); writes are not auto-repaired until the next `set`.
- **Not for secrets.** `localStorage` / `sessionStorage` are readable by any
  script on the origin and survive (local) or last for the tab session (session).
  Never store tokens, PII, or other sensitive data here — keep auth state in the
  BFF/HTTP-only cookies, not browser storage.
- **Browser-only.** The hook reads `localStorage` / `sessionStorage` and the
  `storage` event directly; it is not SSR-safe without a DOM (`useSyncExternalStore`
  falls back to `defaultValue` on the server snapshot, but `setValue` requires a
  real storage backend).

## Out of scope

- **The storage primitive itself** — typed get/set/remove, the `dd:` key
  prefix, and JSON (de)serialization live in [`@granit/storage`](../storage);
  this package only adapts it to React.
- **Server-side / binary storage** — uploading and serving files is the
  separate `@granit/blob-storage` /
  [`@granit/react-blob-storage`](../react-blob-storage) domain, unrelated to this
  browser-storage helper.

## License

Apache-2.0
