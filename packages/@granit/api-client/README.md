# @granit/api-client

Framework-level **HTTP client factory** — the single seam between every
`@granit/*` package and `axios`. It produces a pre-configured `AxiosInstance`
with the framework's request/response interceptors (auth token, tenant header,
CSRF, idempotency key, 401 handling) and re-exports the axios types so no other
package imports `axios` directly.

This is a **framework-agnostic core** package: no React, DOM or Node-only
dependency. It also owns the shared HTTP error model (RFC 7807 Problem Details,
domain error classes, type guards) and idempotency-tombstone helpers consumed
across the framework. The React layer — a context provider that shares one
instance with every domain provider/hook — lives in
[`@granit/react-api-client`](../react-api-client). Wiring of the global
getters is done by sibling infra packages:
[`@granit/react-authentication`](../react-authentication) (token + 401),
[`@granit/react-multi-tenancy`](../react-multi-tenancy) (tenant),
[`@granit/bff`](../bff) (CSRF) and [`@granit/idempotency`](../idempotency)
(idempotency keys).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Peer
dependencies a consumer must declare:

- `axios` (`^1.6.0`) — required.
- `@granit/logger` — optional; wire a redacting logger so interceptor warnings
  (e.g. missing CSRF token) stay out of `console` and route to OTLP. Falls back
  to the package logger (`createLogger('api-client')`) when absent.

## Quick start

```ts
import {
  createApiClient,
  setTokenGetter,
  setTenantGetter,
  setOnUnauthorized,
  isConcurrencyConflict,
} from '@granit/api-client';

// Bearer mode (default): the global token getter is consulted on every request.
const api = createApiClient({ baseURL: '/api', timeout: 15_000 });

// Wire the global getters once, at app init (normally done by the React infra
// packages — shown here for illustration). All createApiClient instances share
// them.
setTokenGetter(async () => keycloak.token);
setTenantGetter(() => activeTenantId);
setOnUnauthorized(() => keycloak.logout());

try {
  const { data } = await api.put(`/tags/${id}`, { ...form, concurrencyStamp });
} catch (err) {
  if (isConcurrencyConflict(err)) {
    // refetch, re-apply edits onto the fresh stamp, resubmit.
  }
}
```

BFF mode swaps Bearer injection for cookie credentials plus an `X-CSRF-Token`
header on mutations:

```ts
import { createApiClient } from '@granit/api-client';
import { CsrfManager } from '@granit/bff';

const csrf = new CsrfManager(/* … */);

const api = createApiClient({
  baseURL: '/api',
  mode: 'bff',
  csrfTokenGetter: () => csrf.getToken(),
  refreshCsrfToken: () => csrf.fetchToken(), // awaited on the bootstrap race
});
```

## Public API

| Symbol                                     | Kind | Purpose                                                                                                            |
| ------------------------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------ |
| `createApiClient`                          | fn   | Build a configured `AxiosInstance` (auth/tenant/CSRF/401/idempotency)                                              |
| `ApiClientConfig`                          | type | `createApiClient` options (`baseURL`, `mode`, `transport`, …)                                                      |
| `ApiClientMode`                            | type | `'bearer' \| 'bff'`                                                                                                |
| `ApiClientTransport`                       | type | `'xhr' \| 'fetch'` axios adapter selector (SSR fetch opt-in)                                                       |
| `RequestFetchOptions`                      | type | Per-request `RequestInit` subset forwarded to the fetch adapter                                                    |
| `CsrfTokenGetter`                          | type | `() => string \| null` getter contract for BFF mode                                                                |
| `createMutator`                            | fn   | Wrap an instance into an orval custom-instance mutator                                                             |
| `buildApiUrl`                              | fn   | Join a base path with `/`-delimited segments (caller encodes)                                                      |
| `setTokenGetter`                           | fn   | Register the global async Bearer token getter                                                                      |
| `setTenantGetter`                          | fn   | Register the global sync `X-Tenant-Id` getter                                                                      |
| `setOnUnauthorized`                        | fn   | Register the global 401-response callback (force logout)                                                           |
| `setIdempotencyKeyGenerator`               | fn   | Register the global `Idempotency-Key` generator for mutations                                                      |
| `HttpError`                                | fn   | Error carrying `status` + RFC 7807 `problemDetails`                                                                |
| `ConcurrencyConflictError`                 | fn   | `HttpError` specialization for optimistic-concurrency 409                                                          |
| `ValidationError`                          | fn   | Client/server validation failure with structured `details`                                                         |
| `TimeoutError`                             | fn   | Request exceeded the configured timeout                                                                            |
| `isConcurrencyConflict`                    | fn   | Type guard for a 409 (mapped or raw Axios error)                                                                   |
| `isBackendUnavailable`                     | fn   | `true` when the transport failed with no HTTP response                                                             |
| `getHttpStatus`                            | fn   | HTTP status from an error, or `undefined` if no response                                                           |
| `ProblemDetails` / `ProblemDetailsPayload` | type | RFC 7807 payload (`title`, `status`, `errors`, `traceId`, …)                                                       |
| `ValidationDetails`                        | type | Structured validation failure (`field`, `constraint`, `fieldErrors`)                                               |
| `isIdempotencyTombstoned`                  | fn   | `true` when a 413 tombstone makes same-key retry permanently fail                                                  |
| `readIdempotencyTombstone`                 | fn   | Extract `{ reason }` from the `X-Idempotency-Tombstone` header                                                     |
| `isIdempotentReplay`                       | fn   | `true` when the backend served a cached replay (`Idempotent-Replayed`)                                             |
| `IdempotencyTombstoneInfo`                 | type | Machine-readable tombstone reason                                                                                  |
| Axios façade                               | type | `AxiosError`, `AxiosInstance`, `AxiosRequestConfig`, `AxiosResponse`, `InternalAxiosRequestConfig`, `isAxiosError` |

## Out of scope / caveats

- **Single import seam.** Every `@granit/*` package MUST import axios types from
  here, never from `axios` directly — enforced by the `no-restricted-imports`
  ESLint rule. Future client swaps, branding or interceptor contracts land here
  without touching consumers.
- **Global getters, not config.** `setTokenGetter` / `setTenantGetter` /
  `setOnUnauthorized` / `setIdempotencyKeyGenerator` are process-global and
  shared by all instances. In development a re-wire logs a warning (provider
  double-mount, competing auth providers, or supply-chain override); production
  stays silent. The package never wires them itself — that is the infra
  packages' job.
- **No `X-Tenant-Id` auto-injection of a Host tenant.** The header is sent only
  when the registered tenant getter returns a value; the client does not
  fabricate or impersonate a tenant.
- **BFF mode sends no `Authorization` header.** Credentials travel as cookies
  and the BFF YARP proxy adds the bearer token server-side; only `X-CSRF-Token`
  is injected, on mutation methods. If neither `csrfTokenGetter` nor
  `refreshCsrfToken` produces a token the mutation is sent anyway and a warning
  is emitted — the BFF will reject it.
- **`transport: 'fetch'` is opt-in.** Per-request `fetchOptions`
  (`RequestFetchOptions`) only reach the runtime under the fetch adapter;
  required for SSR consumers (e.g. Next.js) that depend on a patched global
  `fetch` for caching/revalidation. SSR-only `RequestInit` fields such as Next's
  `next` are never declared by this package.
- **Transport errors are not remapped.** A network/DNS/timeout failure surfaces
  as the raw `AxiosError` (no `response`); use `isBackendUnavailable` to
  distinguish "backend unreachable" from a transient 5xx.
- **No business endpoints.** This package owns no routes or DTOs — domain calls
  live in the per-module `@granit/*` packages that consume the instance.

## License

Apache-2.0
