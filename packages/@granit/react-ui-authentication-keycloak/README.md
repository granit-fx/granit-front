# @granit/react-ui-authentication-keycloak

The **Keycloak auth provider** for Granit apps. This is the **react-ui admin
feature kit** layer for the Keycloak identity provider: it wires
[`@granit/react-authentication-keycloak`](../react-authentication-keycloak)'s
`useKeycloakInit` hook into the app's auth context, forwards the active UI locale
to the IdP login redirect, and renders an init spinner until the Keycloak session
resolves. It holds no transport or token logic of its own — that lives in the
hooks layer below it.

The Keycloak parallel to
[`@granit/react-ui-authentication-local`](../react-ui-authentication-local): the
local (OpenIddict) package carries the self-hosted **login pages**; Keycloak hosts
its own login UI on the IdP, so this package ships only the **provider** — there
are no login pages to render here. The package split over the Keycloak backend is:

- [`@granit/authentication-keycloak`](../authentication-keycloak) —
  framework-agnostic core types (`KeycloakAuthContextType`, `KeycloakCoreConfig`,
  `KeycloakUserInfo`, `KeycloakEvent`), built on `@granit/authentication`'s
  `BaseAuthContextType`.
- [`@granit/react-authentication-keycloak`](../react-authentication-keycloak) —
  React hooks layer: `useKeycloakInit` (check-sso init, PKCE S256, token refresh,
  role checks, Bearer wiring into `@granit/api-client`).
- `@granit/react-ui-authentication-keycloak` (this package) — the provider that
  binds the hook to a host-owned auth context.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/authentication` — the shared `BaseAuthContextType` the Keycloak context
  extends, plus `createAuthContext`.
- `@granit/authentication-keycloak` — core types (`KeycloakAuthContextType`,
  `KeycloakCoreConfig`) consumed by the provider's props.
- `@granit/react-authentication-keycloak` — supplies the `useKeycloakInit` hook
  this provider wraps.
- `@granit/react-localization` — `useTranslation`, for the locale forwarded to the
  login redirect and the translated init label.
- `@granit/react-ui` — the `Spinner` rendered during init.
- `react` (`^19`).

## Quick start

The host app creates its own typed auth context once via `createAuthContext`,
then mounts this provider with that context and the Keycloak environment config.
Components below it read the live session through the host's `useAuth()`.

```tsx
import { createAuthContext } from '@granit/authentication';
import { KeycloakAuthProvider } from '@granit/react-ui-authentication-keycloak';

import type { KeycloakAuthContextType } from '@granit/authentication-keycloak';

// Create the context once, app-wide. Keycloak's context already extends the
// shared BaseAuthContextType with the live `keycloak` instance.
export const { AuthContext, useAuth } = createAuthContext<KeycloakAuthContextType>();

function App({ children }: { children: React.ReactNode }) {
  return (
    <KeycloakAuthProvider
      context={AuthContext}
      config={{
        url: import.meta.env.VITE_KEYCLOAK_URL,
        realm: import.meta.env.VITE_KEYCLOAK_REALM,
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
      }}
    >
      {children}
    </KeycloakAuthProvider>
  );
}

function SignInButton() {
  const { authenticated, login, logout } = useAuth();
  // `login()` is locale-aware: the provider forwards the active UI language
  // (i18n.language) to the Keycloak login redirect automatically.
  return authenticated ? (
    <button type="button" onClick={() => logout()}>Sign out</button>
  ) : (
    <button type="button" onClick={() => login()}>Sign in</button>
  );
}
```

While `useKeycloakInit` resolves the session (the silent check-sso round-trip),
the provider renders a full-screen `Spinner` with an `Auth.Initializing` label
(falling back to `Initializing…` when the host has not registered that key) and
does **not** mount its children. Once init completes it supplies the context with
`{ keycloak, authenticated, loading, user, login, logout }`, so `useAuth()`
resolves for every descendant.

## Public API

| Symbol                      | Kind     | Purpose                                                                |
| --------------------------- | -------- | ---------------------------------------------------------------------- |
| `KeycloakAuthProvider`      | provider | Wires `useKeycloakInit` into a host auth context; spinner then session |
| `KeycloakAuthProviderProps` | type     | `{ context, config, children }` props for the provider                 |

`KeycloakAuthProviderProps.context` is the host's
`Context<KeycloakAuthContextType | undefined>` (from `createAuthContext`);
`config` is the `KeycloakCoreConfig` re-exported by
[`@granit/authentication-keycloak`](../authentication-keycloak)
(`url` / `realm` / `clientId` plus optional `silentCheckSso`,
`useTokenClaims`, and lifecycle callbacks).

## Out of scope / caveats

- **App owns the context, package owns the wiring.** The host creates its
  context instance with `createAuthContext` and decides — via its auth-mode —
  whether to mount this provider; the package never owns a singleton context.
  This keeps it app-agnostic (no admin-role, FHIR, or Capacitor specifics).
- **No login pages.** Keycloak hosts its own login, registration, and password
  flows on the IdP. Unlike
  [`@granit/react-ui-authentication-local`](../react-ui-authentication-local),
  this package ships no rendered auth pages — only the provider.
- **No native / Capacitor support here.** `useKeycloakInit` is web-only
  (silent check-sso via iframe + `silent-check-sso.html` at the origin root).
  Apps needing native flows use the hook's `keycloakRef` to build
  platform-specific login/logout URLs directly, below this provider.
- **i18n keys are host-owned.** This package emits no `locales/` bundle; it reads
  the `Auth.Initializing` key from the host i18n instance and supplies an inline
  English fallback. Register the localized string in the host's `translation`
  namespace to override it.
- **Token storage and CSRF are the hooks layer's concern.**
  `@granit/react-authentication-keycloak` wires the Bearer token getter and the
  401 logout handler into `@granit/api-client`; this provider only surfaces the
  resolved session and does not touch token storage.

## License

Apache-2.0
