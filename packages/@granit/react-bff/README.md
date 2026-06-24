# @granit/react-bff

React bindings for [`@granit/bff`](../bff) — the **React hooks + provider** layer
of the Backend-for-Frontend auth stack. It owns the browser-side session
lifecycle against the .NET `Granit.Bff` module (`contracts/openapi/bff.json`):
the cookie-backed session check on `/{prefix}/bff/user`, CSRF token issuance on
`/{prefix}/bff/csrf-token`, and the login/logout full-page redirects to
`/{prefix}/bff/login` and `/{prefix}/bff/logout`.

This is the **headless** layer. `@granit/bff` holds the framework-agnostic core
(types, `CsrfManager`, the Zod-grade `parseBffSessionResponse` validator); this
package adapts that core to React via a context provider, a handful of hooks, and
a route guard. The opinionated admin companion — which bridges the BFF session
into the app's auth context, wires the 401→login interceptor and renders the
init/retry screens — lives in [`@granit/react-ui-bff`](../react-ui-bff). Most
apps consume `react-ui-bff`; reach for this package directly only when you need
the raw provider and hooks without the UI shell.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption. Declare the peer dependencies:

- `@granit/bff` — the core types, `CsrfManager` and session-response validator.
- `@granit/logger` — `createLogger`; the provider logs session-check failures
  through the optional `BffConfig.logger`.
- `react` (`^19`).

Optional peers (only when using the `./testing` subpath):

- `@granit/testing`, `@granit/types`, `msw` (`^2.12`) — MSW handlers + mock
  fixtures.

## Quick start

The provider takes a single `config: BffConfig` object. It runs one session
check on mount, then polls `/{prefix}/bff/user` on a jittered, visibility-gated
interval (default 60 s; `sessionCheckInterval: 0` disables polling).

```tsx
import { BffProvider, BffGuard, useBffAuth } from '@granit/react-bff';

function App() {
  return (
    <BffProvider config={{ pathPrefix: '/admin' }}>
      <BffGuard fallback={<Splash />}>
        <Dashboard />
      </BffGuard>
    </BffProvider>
  );
}

function Dashboard() {
  const { user, logout } = useBffAuth();
  // `user` is a discriminated union: tenant users carry `tenantId`,
  // Host users never do (IsHost ⇔ tenant_id absent).
  return (
    <header>
      <span>{user?.name}</span>
      <button onClick={logout}>Sign out</button>
    </header>
  );
}
```

Wire the active tenant into `@granit/api-client` so the `X-Tenant-Id` header
follows the BFF session. `useBffTenantGetter` returns `undefined` for Host and
anonymous sessions, so the interceptor never auto-injects a tenant for a Host
user (that requires explicit `MultiTenancy.Host.Impersonate` impersonation):

```tsx
import { setTenantGetter } from '@granit/api-client';
import { useBffTenantGetter } from '@granit/react-bff';
import { useEffect } from 'react';

function ApiClientBootstrap() {
  const getTenantId = useBffTenantGetter();
  useEffect(() => setTenantGetter(getTenantId), [getTenantId]);
  return null;
}
```

For mutations issued outside the Axios client, `useBffFetch` returns a `fetch`
wrapper that injects the CSRF token on `POST`/`PUT`/`PATCH`/`DELETE` and sends
`credentials: 'include'`.

## Public API

| Symbol               | Kind      | Purpose                                                          |
| -------------------- | --------- | ---------------------------------------------------------------- |
| `BffProvider`        | provider  | Runs the session check + CSRF prefetch, exposes the auth context |
| `BffProviderProps`   | type      | `{ config: BffConfig; children }`                                |
| `BffContextType`     | type      | Context: `user`, `isAuthenticated`, `isLoading`, `login`, etc.   |
| `useBffConfig`       | hook      | Read the full context; throws outside a `<BffProvider>`          |
| `useBffAuth`         | hook      | `{ user, isAuthenticated, isLoading, login, logout }`            |
| `useBffCsrf`         | hook      | `{ csrfToken, refreshCsrf }` from the active `CsrfManager`       |
| `useBffFetch`        | hook      | Memoized `fetch` wrapper: CSRF on mutations + `credentials`      |
| `resolveBffTenantId` | fn        | `BffUser -> tenantId`; `undefined` for Host / anonymous          |
| `useBffTenantGetter` | hook      | Context-bound `() => string \| undefined` for `setTenantGetter`  |
| `BffGuard`           | component | Renders children only when authed, else redirects to login       |
| `BffGuardProps`      | type      | `{ children; fallback? }`                                        |

### Testing subpath (`@granit/react-bff/testing`)

| Symbol              | Kind  | Purpose                                                         |
| ------------------- | ----- | --------------------------------------------------------------- |
| `createBffHandlers` | fn    | MSW handlers for `GET /bff/user` + `POST /bff/csrf-token`       |
| `mockBffTenantUser` | const | Authenticated tenant user fixture (`isHost: false`, `tenantId`) |
| `mockBffHostUser`   | const | Authenticated Host user fixture (`isHost: true`, no `tenantId`) |
| `mockBffCsrfToken`  | const | Canonical CSRF token returned by the mock handler               |

MSW intercepts native `fetch`, which is what the BFF bootstrap uses
deliberately — `@granit/bff` sits *below* the Axios client, so these handlers
mock the auth bootstrap, not the domain endpoints.

## Out of scope / caveats

- **Session listing/revocation moved off the BFF** (granit-dotnet #2692). The
  caller's own sessions and devices are now served by the canonical, transport-
  agnostic `/sessions` (+ `/devices`) endpoints. Use
  [`@granit/react-identity`](../react-identity) (`useMyUserSessions`,
  `useRevokeMyUserSession`, `useRevokeMyOtherUserSessions`, `useMyUserDevices`).
  This package retains only auth bootstrap (`/bff/user`) and CSRF
  (`/bff/csrf-token`).
- **CSRF prefetch is best-effort.** A transient CSRF failure must never bounce a
  genuinely authenticated user into a login loop; the `CsrfManager` /
  api-client interceptor refreshes the token on demand. The CSRF token gates
  mutations, not the authenticated *state*.
- **Hardened session parse (VULN-205).** The provider rejects non-OK and
  non-JSON responses before parsing, and routes every `/bff/user` payload
  through `parseBffSessionResponse` (which enforces the `IsHost ⇔ tenantId
  absent` invariant). Captive portals, proxy error pages and HTML redirects
  cannot flow attacker-influenced fields into the auth context.
- **No auto-tenant for Host.** `resolveBffTenantId` returns `undefined` for Host
  users by design — the backend rejects an `X-Tenant-Id` from a Host session
  unless `MultiTenancy.Host.Impersonate` is held and impersonation is an
  explicit, short-lived action. Never bypass it.
- **Login redirect is one-shot per mount.** `BffGuard` fires `login()` from an
  effect, gated by a ref, so React 19 StrictMode double-invocation or concurrent
  re-renders start a single OIDC redirect — not an overlapping herd.
- **PII in logs.** The provider's session-check failures go through the optional
  `BffConfig.logger`; wire a redacting `@granit/logger` instance so transient
  auth errors don't leak PII into `console`.

## License

Apache-2.0
