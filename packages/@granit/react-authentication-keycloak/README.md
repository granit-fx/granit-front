# @granit/react-authentication-keycloak

React **hooks** layer for Keycloak OIDC authentication. Exposes the single
`useKeycloakInit` hook, which instantiates `keycloak-js`, runs the `check-sso`
flow with PKCE S256, keeps the token alive, loads the user profile, and wires the
Bearer token into `@granit/api-client` so every domain request is authenticated.

There is **no Granit backend counterpart** — Keycloak is an external identity
provider; this package talks to the realm directly via `keycloak-js`, not to a
`granit-business` module. It sits in the standard three-package split:

- [`@granit/authentication-keycloak`](../authentication-keycloak) — framework-agnostic
  **core**: the `KeycloakCoreConfig`, `KeycloakAuthContextType`, `KeycloakUserInfo`
  and `KeycloakEvent` contracts (no React, no DOM).
- **this package** — the **React hooks** layer: `useKeycloakInit` and its
  `KeycloakCoreResult` return type, plus a `/csp` Trusted Types policy subpath.
- [`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak) —
  the **react-ui** feature kit: a ready-made `KeycloakAuthProvider` that mounts
  this hook into an app's auth context. Most apps consume that provider rather than
  calling `useKeycloakInit` directly.

The hook is **web-only** (no Capacitor logic). Native shells reuse the same hook
and override `login`/`logout`/`register` via the exposed `keycloakRef` — see the
hook doc comment.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not from a
public registry. A consumer must declare these peers:

- `@granit/authentication` — shared `BaseAuthContextType`, `LoginOptions`,
  `LogoutOptions`, `OidcUserInfo`.
- `@granit/authentication-keycloak` — the Keycloak config/context contracts the
  hook consumes and returns.
- `@granit/react-authentication` — the React auth-context primitives.
- `@granit/api-client` — receives the token getter and the on-unauthorized handler
  the hook installs.
- `@granit/csp` — backs the `/csp` Trusted Types policy.
- `@granit/logger` — `createLogger` for all runtime logging.
- `keycloak-js` `^26` and `react` `^19`.

## Quick start

Most apps mount the provider from
[`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak).
Use this hook directly only when building a custom provider or a native shell.

```tsx
import { useKeycloakInit } from '@granit/react-authentication-keycloak';

import type { KeycloakCoreConfig } from '@granit/authentication-keycloak';

const config: KeycloakCoreConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  // Read profile from the access token instead of an extra /userinfo round-trip.
  useTokenClaims: true,
  onAuthLogout: () => {
    /* clear app caches */
  },
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, authenticated, user, login, logout, hasRealmRole } =
    useKeycloakInit(config);

  if (loading) return <Spinner />;
  if (!authenticated) return <button onClick={() => login()}>Sign in</button>;

  return (
    <>
      <header>
        {user?.preferred_username}
        {hasRealmRole('admin') && <AdminBadge />}
        <button onClick={() => logout()}>Sign out</button>
      </header>
      {children}
    </>
  );
}
```

Once `authenticated` is `true`, `@granit/api-client` automatically attaches the
Bearer token (refreshing on demand) and triggers a Keycloak logout on a `401`, so
domain hooks need no further auth wiring.

### Trusted Types (`/csp`)

Under a CSP `require-trusted-types-for 'script'`, `keycloak-js` writes its silent
check-sso and session iframes through a script sink. Install the policy at
bootstrap, **after** registering the authority origin(s):

```ts
import {
  installPolicy,
  setKeycloakAuthorities,
} from '@granit/react-authentication-keycloak/csp';

setKeycloakAuthorities([import.meta.env.VITE_KEYCLOAK_URL]);
installPolicy(); // idempotent, SSR-safe, no-op when Trusted Types are absent
```

List `granit-keycloak` in the CSP `trusted-types` directive. The policy resolves
every script URL against the document and rejects any origin that is neither
same-origin nor in the registered authority allow-list.

## Public API

Default export (`@granit/react-authentication-keycloak`):

| Symbol               | Kind | Purpose                                                                                                                            |
| -------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `useKeycloakInit`    | hook | Init `keycloak-js`, run check-sso/PKCE, refresh the token, load the user, wire `@granit/api-client`; returns auth state + actions  |
| `KeycloakCoreResult` | type | Hook return: `KeycloakAuthContextType` plus `keycloakRef`, the `login`/`logout`/`register` actions, role checks, and `tokenParsed` |

`KeycloakCoreResult` extends `KeycloakAuthContextType` (`keycloak`,
`authenticated`, `loading`, `user`) with `keycloakRef`, `login`, `logout`,
`register`, `hasRealmRole`, `hasResourceRole`, `isTokenExpired`, and the decoded
`tokenParsed`.

CSP subpath (`@granit/react-authentication-keycloak/csp`):

| Symbol                        | Kind  | Purpose                                                                                   |
| ----------------------------- | ----- | ----------------------------------------------------------------------------------------- |
| `installPolicy`               | fn    | Install the `granit-keycloak` Trusted Types policy (idempotent, SSR-safe)                 |
| `setKeycloakAuthorities`      | fn    | Register the Keycloak authority origin(s) the policy accepts; call before `installPolicy` |
| `GRANIT_KEYCLOAK_POLICY_NAME` | const | The policy name (`'granit-keycloak'`) for the CSP `trusted-types` directive               |

The hook **input** (`KeycloakCoreConfig`) and the contract types it returns
(`KeycloakAuthContextType`, `KeycloakUserInfo`, `KeycloakEvent`) live in the core
sibling [`@granit/authentication-keycloak`](../authentication-keycloak); import
them from there.

## Out of scope / caveats

- **Web-only.** No Capacitor / native deep-link handling. Native shells build their
  own `login`/`logout` URLs from `keycloakRef` and add the `appUrlOpen` listener
  themselves — the hook deliberately stays platform-neutral.
- **Single init, stable config.** The hook guards against double-init (React strict
  mode / remounts). Treat `config` as effectively static; identity-changing fields
  (`url`, `realm`, `clientId`, the callbacks) are in the effect deps but the
  one-shot guard means the live instance is not torn down and rebuilt — supply
  stable references.
- **`setKeycloakAuthorities` before `installPolicy`.** The policy closure captures
  the allow-list at install time. Calling `installPolicy` with no authority
  registered throws for any off-origin (non-same-origin) script URL.
- **Client-side role checks are a UX hint, not enforcement.** `hasRealmRole` /
  `hasResourceRole` read the decoded token in the browser; an attacker can flip
  them. Every protected endpoint must re-check authorization on the backend.
- **`useTokenClaims` requires client mappers.** Reading the profile from
  `tokenParsed` skips the `/userinfo` call but only works when the Keycloak client
  is configured to emit the needed claims (`email`, `name`, …) in the access token;
  otherwise leave it `false` (the default) to call `loadUserInfo()`.

## License

Apache-2.0
