# @granit/react-authentication-mock

Mock auth **provider** for development and tests — it satisfies the app's auth
context with a configurable fake authenticated user and **no real IdP**, so
`useAuth()` resolves without Keycloak/BFF wiring. Pattern-agnostic and IdP-free:
the provider installs a fake context value (`authenticated: true`, no-op
`login`/`logout`) so gated UI renders against a known identity. The app keeps
owning its context instance and demo user; this package owns the reusable
mechanism.

This is the **React provider** layer. It is one of the per-provider front-ends
in the authentication family that share the `BaseAuthContextType` base from
[`@granit/authentication`](../authentication): the real provider lives in
[`@granit/react-authentication-keycloak`](../react-authentication-keycloak)
(with core [`@granit/authentication-keycloak`](../authentication-keycloak) and
admin kit [`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak));
this mock is the swap-in used when no IdP is available. It has no backend
counterpart of its own — it stands in for one. When `bffConfig` is supplied it
optionally wraps the tree in a `BffProvider` from
[`@granit/react-bff`](../react-bff) so `useBffConfig` consumers (e.g. session
cards) keep resolving against MSW-backed BFF endpoints in mock mode.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers:

- `@granit/authentication` — `BaseAuthContextType` base for the auth context.
- `@granit/authentication-keycloak` — `KeycloakAuthContextType` /
  `KeycloakUserInfo`, the context shape the provider fills.
- `@granit/bff` — the `BffConfig` shape accepted by the optional `bffConfig`.
- `@granit/react-bff` — supplies `BffProvider` for the optional BFF wrapping.
- `react` (`^19.0.0`).

## Quick start

```tsx
import { MockAuthProvider } from '@granit/react-authentication-mock';

import { AuthContext } from './auth-context'; // createAuthContext() instance (app-owned)
import { MOCK_USER } from './mock-user'; // your demo KeycloakUserInfo (app-owned)

// `AuthContext` is created once by the app via `createAuthContext()` from
// `@granit/react-authentication`; the provider only fills it with a fake value.
export function MockApp() {
  return (
    <MockAuthProvider
      context={AuthContext}
      user={MOCK_USER}
      bffConfig={{ pathPrefix: '/bff' }} // optional — wraps in BffProvider
      loadingMs={300} // optional — artificial init delay before children render
      loadingFallback={<Splash />} // optional — shown during the delay
    >
      <App />
    </MockAuthProvider>
  );
}
```

The provider sets the context value to
`{ keycloak: null, authenticated: true, loading, user, login, logout }` with
`login`/`logout` as no-ops. With `loadingMs > 0` it renders `loadingFallback`
for that many milliseconds before mounting `children` — useful for exercising
auth-loading states in demos and tests.

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `MockAuthProvider` | provider | Fills the app's auth context with a fake user, no IdP |
| `MockAuthProviderProps` | type | Props: `context`, `user`, `bffConfig?`, `loadingMs?`, `loadingFallback?`, `children` |

`MockAuthProviderProps.context` is typed `Context<KeycloakAuthContextType | undefined>`
(the instance `createAuthContext()` returns) and `user` is a `KeycloakUserInfo`.

## Out of scope / caveats

- **Development and tests only — never ship it.** The provider hardcodes
  `authenticated: true` and ignores any token; bundling it into a production
  build would bypass authentication entirely. Gate it behind a mock-mode flag
  and keep it out of the production entry point.
- **UX gating is not enforcement.** Like the real providers, a fake
  `authenticated`/permission state only drives client-side rendering. The .NET
  backend remains the sole authority; the mock does not — and cannot — make any
  request actually authorized.
- **No real session.** `login`/`logout` are no-ops, there is no token refresh,
  and `keycloak` is always `null`. Code paths that read the live `keycloak`
  instance or expect real token claims will not be exercised by this provider.
- **`bffConfig` is opt-in.** Without it the tree is *not* wrapped in
  `BffProvider`, so `useBffConfig` consumers will throw their usual
  missing-provider error; supply `bffConfig` whenever the mocked tree renders
  BFF-backed components.

## License

Apache-2.0
