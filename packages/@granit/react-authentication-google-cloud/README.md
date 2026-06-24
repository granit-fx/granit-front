# @granit/react-authentication-google-cloud

React hooks layer for **Google Cloud Identity Platform** (Firebase Auth) — the
glue that drives a Firebase sign-in flow from a React app and feeds the resulting
ID token into the framework's HTTP client.

This is the **React hooks** layer in the IdP three-way split:

- [`@granit/authentication-google-cloud`](../authentication-google-cloud) —
  framework-agnostic **core**: the `GoogleCloudAuthContextType` /
  `GoogleCloudCoreConfig` contracts, no React, no `firebase` import.
- **`@granit/react-authentication-google-cloud`** (this package) — the
  `useGoogleCloudInit` hook: Firebase app init, auth-state listener, token
  acquisition, OIDC claim extraction, and `@granit/api-client` Bearer wiring.
- [`@granit/react-ui-authentication-google-cloud`](../react-ui-authentication-google-cloud)
  — the **react-ui** feature kit: `GoogleCloudAuthProvider`, which mounts this
  hook into the app's auth context, forwards the active UI locale, and renders an
  init spinner until the session resolves.

It is one of a family of interchangeable IdP adapters
([`-keycloak`](../react-authentication-keycloak),
[`-entraid`](../react-authentication-entraid),
[`-cognito`](../react-authentication-cognito),
[`-local`](../react-authentication-local), …), all built on the shared base
context from [`@granit/react-authentication`](../react-authentication). There is
no Granit backend module: the only server interaction is the Firebase ID token
sent as a `Bearer` to the app's own API via `@granit/api-client`. Identity is
brokered entirely by Google Cloud Identity Platform.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. A consumer must declare these
peers:

- `@granit/api-client` — receives the token getter and the on-unauthorized
  handler (`setTokenGetter` / `setOnUnauthorized`).
- `@granit/authentication` — `LoginOptions` / `LogoutOptions` / `OidcUserInfo`.
- `@granit/authentication-google-cloud` — the core config + context contracts.
- `@granit/react-authentication` — the shared auth-context factory
  (`createAuthContext`) the provider plugs into.
- `@granit/logger` — structured logging (`createLogger`); never `console.*`.
- `firebase` (`>=10.0.0`) — `firebase/app` + `firebase/auth`.
- `react` (`^19.0.0`).

## Quick start

Most apps consume the `GoogleCloudAuthProvider` from the react-ui sibling rather
than calling the hook directly. To wire the hook by hand:

```tsx
import { useGoogleCloudInit } from '@granit/react-authentication-google-cloud';

import type { GoogleCloudCoreConfig } from '@granit/authentication-google-cloud';

const config: GoogleCloudCoreConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'myproject.firebaseapp.com',
  projectId: 'myproject',
  scopes: ['profile', 'email'],
  // tokenStorage defaults to 'memory' — see Caveats before changing it.
  onSessionExpired: () => {
    /* redirect to a logged-out screen */
  },
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { authenticated, loading, user, login, logout } = useGoogleCloudInit(config);

  if (loading) return <p>Initializing…</p>;
  if (!authenticated) return <button onClick={() => login()}>Sign in with Google</button>;

  return (
    <>
      <header>
        {user?.name} <button onClick={() => logout()}>Sign out</button>
      </header>
      {children}
    </>
  );
}
```

`login()` runs a redirect sign-in (`signInWithRedirect` with a
`GoogleAuthProvider`, plus any configured `scopes`); the session resolves on the
return navigation via the auth-state listener. Once a Firebase user appears the
hook registers a token getter so every subsequent `@granit/api-client` request
carries a fresh Firebase ID token, and an on-unauthorized handler that signs the
user out on a `401`.

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `useGoogleCloudInit` | hook | Init Firebase Auth, track auth state, wire Bearer token + logout |
| `GoogleCloudCoreResult` | type | Hook return: `authRef`, `firebaseAuth`, `authenticated`, `loading`, `user`, `login`, `logout` |

`GoogleCloudCoreResult` extends `GoogleCloudAuthContextType` (from the core
sibling) with a direct `authRef` to the live `firebase/auth` `Auth` instance and
the `login` / `logout` callbacks. The `login`/`logout` signatures accept
`LoginOptions` / `LogoutOptions` from `@granit/authentication`; `logout` honours
`redirectUri` by navigating after sign-out.

## Out of scope / caveats

- **Token storage defaults to in-memory (VULN-201).** `tokenStorage` defaults to
  `'memory'` (`inMemoryPersistence`) so the Firebase refresh token never lands in
  IndexedDB or `localStorage`, where a same-origin script (XSS, a browser
  extension) could lift it. `'sessionStorage'` maps to Firebase session
  persistence; `'localStorage'` maps to Firebase **IndexedDB** persistence.
  Override only when cross-tab / cross-reload persistence is required *and* the
  app ships an XSS-hardened CSP — and prefer the BFF cookie pattern
  (`@granit/bff`) for durable sessions.
- **ID tokens are a UX/transport concern, not authorization.** The token getter
  only attaches a `Bearer` credential; every protected endpoint must still verify
  the token and re-check permissions server-side. Client-side `authenticated` is
  a rendering hint, never a security boundary.
- **Redirect flow only.** Sign-in uses `signInWithRedirect`, not a popup; the
  session completes on the return navigation. `LoginOptions` is accepted for
  signature parity with sibling adapters but the current implementation does not
  consume its fields beyond delegating to Firebase.
- **One init per mount.** Firebase app/auth initialization is guarded to run once;
  changing `config` identity (`apiKey`, `authDomain`, `projectId`, callbacks)
  drives the effect, so memoize the config object in the host.
- **No Granit backend module.** This package mirrors no `contracts/openapi/*`
  spec — identity is fully delegated to Google Cloud Identity Platform.

## License

Apache-2.0
