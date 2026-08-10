# @granit/idempotency

Automatic `Idempotency-Key` header injection for mutation requests — the
framework-level wiring on top of the idempotency hooks built into
`@granit/api-client`. It targets the .NET `Granit.Http.Idempotency` middleware,
which caches a completed response per key and replays it (instead of
re-executing the handler) on any retry that carries the same key.

This is a thin **infrastructure** package, framework-agnostic at runtime: it
holds no React, DOM or Node-only dependency and ships no domain DTO. `enableIdempotency()`
registers a key generator on the shared Axios instance via
`setIdempotencyKeyGenerator`, so every `POST`/`PUT`/`PATCH`/`DELETE` flowing
through `@granit/api-client` gets an `Idempotency-Key` header. It also re-exports
the tombstone/replay detection helpers from `@granit/api-client` so a consumer
only needs this one dependency to handle idempotency end-to-end (generation +
retry decisions). There is no `react-idempotency` or `react-ui-idempotency`
sibling — the lone framework-aware export, `shouldRetryIgnoringTombstone`, is a
plain predicate compatible with TanStack Query's `retry` option.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare the single peer:

- `@granit/api-client` — supplies the shared `AxiosInstance` and the
  `setIdempotencyKeyGenerator` / tombstone hooks this package drives.

## Quick start

```ts
// src/main.ts — call once during app initialization.
import { enableIdempotency } from '@granit/idempotency';

enableIdempotency(); // POST/PUT/PATCH/DELETE now carry an Idempotency-Key
```

By default each request mints a fresh UUIDv4 — UNLESS the caller already set an
`Idempotency-Key` header, in which case it is preserved. Reuse a single stable
key across every attempt of one logical operation to make retries replay instead
of double-execute (random per-request keys do NOT make automatic retries safe):

```ts
// Retry-safe mutation: the SAME key rides every attempt of one operation.
api.post('/orders', body, { headers: { 'Idempotency-Key': stableKey } });
```

Wire the retry predicate into the TanStack Query client so a tombstoned response
(server cannot replay — same key always returns HTTP 413) stops burning retries:

```ts
import { QueryClient } from '@tanstack/react-query';
import { shouldRetryIgnoringTombstone, isIdempotentReplay } from '@granit/idempotency';

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: (failureCount, error) => shouldRetryIgnoringTombstone(failureCount, error),
    },
  },
});

// Telemetry / UX: detect a server-served cached copy of a duplicate submission.
const response = await api.post('/orders', body);
if (isIdempotentReplay(response)) {
  // already processed — surface "duplicate submission" instead of a new success
}
```

## Public API

| Symbol                         | Kind | Purpose                                                                   |
| ------------------------------ | ---- | ------------------------------------------------------------------------- |
| `enableIdempotency`            | fn   | Register the key generator on the shared client (call once)               |
| `disableIdempotency`           | fn   | Unregister the generator (testing / feature flags)                        |
| `shouldRetryIgnoringTombstone` | fn   | TanStack Query `retry` predicate; `false` on tombstone                    |
| `IdempotencyClientOptions`     | type | `{ methods?, keyGenerator? }` for `enableIdempotency`                     |
| `isIdempotencyTombstoned`      | fn   | `true` when the error is a non-replayable tombstone (re-export)           |
| `readIdempotencyTombstone`     | fn   | Tombstone `{ reason }` from an error, else `undefined` (re-export)        |
| `isIdempotentReplay`           | fn   | `true` when a response/error was served from the replay cache (re-export) |
| `IdempotencyTombstoneInfo`     | type | `{ reason }` - backend tombstone reason (re-export)                       |

`enableIdempotency` defaults to the mutation methods
`['post', 'put', 'patch', 'delete']`; override via `IdempotencyClientOptions.methods`
or swap the generator via `keyGenerator` (return `undefined` to skip the header
for a given request).

## Caveats

- **Random keys do not make retries safe.** A fresh UUID per attempt is a
  _distinct_ operation to the backend. Only a single stable key reused across
  attempts triggers replay — carry it in the request header (e.g. in the React
  Query mutation variables), not in `enableIdempotency`.
- **Tombstones are terminal.** When the original response could not be cached
  (exceeds the backend `MaxResponseSizeBytes`), the entry is tombstoned and every
  retry with that key returns HTTP 413 (`X-Idempotency-Tombstone`). Recovering
  requires a _new_ key; `shouldRetryIgnoringTombstone` stops the retry loop, and
  unknown tombstone `reason` values should be treated as generic "not replayable".
- **Key length bound.** The backend rejects keys longer than its `MaxKeyLength`
  (default 256 characters) with HTTP 400 before any processing — keep custom
  `keyGenerator` output well under that bound (a UUIDv4 is 36 characters).
- **Replay covers cached errors too.** `isIdempotentReplay` returns `true` for a
  replayed success _or_ a replayed error (e.g. a cached 409/422), since a replay
  reproduces the original status; pass it the response or the error accordingly.
- **Single registration.** `setIdempotencyKeyGenerator` warns when a generator is
  already set; call `enableIdempotency()` once, not per component.

## Out of scope

- **Server-side idempotency store, caching and tombstoning** — owned by the .NET
  `Granit.Http.Idempotency` middleware; this package only emits the header and
  reads the response signals.
- **A React provider / hooks layer** — there is no sibling `@granit/react-idempotency`;
  the one framework-aware export is the standalone `shouldRetryIgnoringTombstone`
  predicate.

## License

Apache-2.0
