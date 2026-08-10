# @granit/react-ui-authentication-google-cloud

The **Google Cloud auth provider** for Granit apps — wires
[`@granit/react-authentication-google-cloud`](../react-authentication-google-cloud)'s
`useGoogleCloudInit` (Google Cloud Identity Platform / Firebase Auth) into the
app's auth context, forwards the active UI locale to the IdP login, and renders an
init spinner until the session resolves. Companion to
[`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak).

This is the **react-ui** layer of the Google Cloud auth split — the thin,
app-facing provider component. It owns no token logic and no DTOs; it adapts the
hooks layer to a host-supplied React context. The split is three packages over
the same Firebase Identity Platform integration (there is no Granit backend
module / OpenAPI contract — auth is delegated to the Google IdP):

- [`@granit/authentication-google-cloud`](../authentication-google-cloud) —
  framework-agnostic core: `GoogleCloudCoreConfig` (Firebase project + token
  storage posture) and `GoogleCloudAuthContextType`.
- [`@granit/react-authentication-google-cloud`](../react-authentication-google-cloud)
  — React hooks layer: `useGoogleCloudInit`, which boots Firebase, listens for
  auth-state changes, extracts OIDC claims, and wires the Bearer token into
  `@granit/api-client`.
- `@granit/react-ui-authentication-google-cloud` (this package) — the provider
  component that mounts the hook and publishes its value to the app's context.

The host owns its auth context instance (from `createAuthContext`) and decides —
via its configured auth-mode — whether to mount this provider; the package owns
the reusable wiring. The published context value is a `KeycloakAuthContextType`
with `keycloak: null`, so the host's `createAuthContext` instance stays
provider-agnostic and can be swapped between IdPs without re-typing.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-authentication-google-cloud` — supplies `useGoogleCloudInit`,
  the Firebase boot + token-wiring hook this provider mounts.
- `@granit/authentication-google-cloud` — `GoogleCloudCoreConfig` (the
  `config` prop shape).
- `@granit/authentication-keycloak` — `KeycloakAuthContextType`, the shared auth
  context value type this provider publishes.
- `@granit/react-localization` — `useTranslation`, for the locale forwarded to
  the IdP login and the localized init label.
- `@granit/react-ui` — `Spinner`, rendered during the init loading state.
- `@granit/authentication` — shared `BaseAuthContextType` base (transitive).
- `react` (`^19`).

## Quick start

Mount the provider above the app, passing the host's auth context instance and a
`GoogleCloudCoreConfig` resolved from the environment. While Firebase initializes
and resolves the session, the provider renders a full-screen spinner; once
resolved it publishes `{ authenticated, loading, user, login, logout }` to the
context, with `login` pre-bound to the active UI locale.

```tsx
import { GoogleCloudAuthProvider } from '@granit/react-ui-authentication-google-cloud';
import type { GoogleCloudCoreConfig } from '@granit/authentication-google-cloud';

import { AuthContext } from './auth-context'; // your createAuthContext() instance

// Resolved from the host environment (Firebase project + token-storage posture).
const config: GoogleCloudCoreConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // tokenStorage defaults to 'memory' — see Caveats before overriding.
};

export function Root({ children }: { children: React.ReactNode }) {
  return (
    <GoogleCloudAuthProvider context={AuthContext} config={config}>
      {children}
    </GoogleCloudAuthProvider>
  );
}
```

Downstream components read the session through the host's auth context (the same
`AuthContext` passed in), not through this package — it exports only the provider.

## Public API

| Symbol                         | Kind     | Purpose                                                        |
| ------------------------------ | -------- | -------------------------------------------------------------- |
| `GoogleCloudAuthProvider`      | provider | Mounts `useGoogleCloudInit`, shows the init spinner, publishes |
|                                |          | the resolved session, and pre-binds `login` to the UI locale   |
| `GoogleCloudAuthProviderProps` | type     | `{ context, config, children }` — host context + core config   |

## Caveats

- **Token-storage posture lives in the core config.** `GoogleCloudCoreConfig.tokenStorage`
  defaults to `'memory'` (`inMemoryPersistence`) so the refresh token never lands
  in browser-accessible storage (IndexedDB / `localStorage`) reachable by a
  same-origin script (XSS, extension). Override only when cross-tab / cross-reload
  persistence is required AND the app ships an XSS-hardened CSP; prefer the BFF
  cookie pattern (`@granit/bff`) for durable sessions. See security audit
  VULN-201. This provider passes the config through untouched — it does not soften
  the default.
- **Context value is `KeycloakAuthContextType`, intentionally.** The provider
  emits `keycloak: null` so a single host context type works across IdPs; do not
  read `keycloak` from a Google Cloud session.
- **Login is redirect-based.** `useGoogleCloudInit` signs in via
  `signInWithRedirect` (full-page navigation), so the provider's `login` ignores
  caller-supplied options other than the locale it injects; the session resolves
  on the return navigation, gated by the init spinner.

## Out of scope

- **Firebase boot, token acquisition, and `@granit/api-client` wiring** — owned by
  [`@granit/react-authentication-google-cloud`](../react-authentication-google-cloud)'s
  `useGoogleCloudInit`. This package only mounts it.
- **Config and context types** — owned by
  [`@granit/authentication-google-cloud`](../authentication-google-cloud).
- **Login UI** — Google Cloud Identity Platform hosts its own sign-in flow
  (redirect); this package ships no login page, only the provider and its spinner.
- **Other IdPs** — Keycloak, Entra ID, Cognito, API keys, and the OpenIddict-based
  local login each have their own `react-ui-authentication-*` provider package.

## License

Apache-2.0
