# @granit/react-ui-authentication-entraid

The **Microsoft Entra ID auth provider** for Granit apps. Wires
[`@granit/react-authentication-entraid`](../react-authentication-entraid)'s
`useEntraIdInit` hook into the app's auth context, forwards the active UI locale
to the Entra ID (Azure AD / MSAL) login redirect, and renders a full-screen init
spinner until the session resolves.

This is the **react-ui admin feature kit** layer — the thinnest one in the
authentication stack: a single drop-in provider component. The split over the
external Entra ID IdP is three packages (there is no `.NET` backend module — the
IdP is Azure AD itself, so no `contracts/openapi/*.json` applies):

- [`@granit/authentication-entraid`](../authentication-entraid) —
  framework-agnostic core: `EntraIdCoreConfig`, `EntraIdAuthContextType` (no
  React, no DOM).
- [`@granit/react-authentication-entraid`](../react-authentication-entraid) —
  React hook layer: `useEntraIdInit` (MSAL instantiation, silent SSO, token
  acquisition, Bearer wiring into `@granit/api-client`).
- `@granit/react-ui-authentication-entraid` (this package) — the mountable
  `EntraIdAuthProvider`.

It is the Entra ID parallel to
[`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak):
both are pure providers (the IdP hosts its own login UI, unlike
[`@granit/react-ui-authentication-local`](../react-ui-authentication-local),
which ships OpenIddict login pages). To stay mount-interchangeable behind one
app auth context, this provider deliberately produces a `KeycloakAuthContextType`
value with `keycloak: null` — apps key both providers off the same context type
and pick one at runtime via their auth-mode.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-authentication-entraid` — supplies `useEntraIdInit`, the hook
  this provider wraps.
- `@granit/authentication-entraid` — the `EntraIdCoreConfig` type passed in.
- `@granit/authentication-keycloak` — supplies `KeycloakAuthContextType`, the
  shared context shape this provider fills.
- `@granit/react-localization` — `useTranslation` for the locale-aware login and
  the spinner label.
- `@granit/react-ui` — the `Spinner` rendered during init.
- `@granit/authentication` — shared base types (`BaseAuthContextType`,
  `LoginOptions`).
- `react` (`^19`).

## Quick start

The app owns its auth context instance (from `createAuthContext`) and decides —
via its auth-mode — whether to mount this provider. Mount it once near the root;
everything below it reads the resolved auth state from the same context.

```tsx
import { EntraIdAuthProvider } from '@granit/react-ui-authentication-entraid';

import type { EntraIdCoreConfig } from '@granit/authentication-entraid';

import { AuthContext } from './auth-context'; // your createAuthContext() instance

const entraIdConfig: EntraIdCoreConfig = {
  clientId: import.meta.env.VITE_ENTRAID_CLIENT_ID,
  authority: import.meta.env.VITE_ENTRAID_AUTHORITY, // https://login.microsoftonline.com/{tenantId}
  redirectUri: window.location.origin,
  scopes: ['openid', 'profile', 'email'],
  // cacheLocation defaults to 'memory' — see Caveats before overriding.
};

function App({ children }: { children: React.ReactNode }) {
  return (
    <EntraIdAuthProvider context={AuthContext} config={entraIdConfig}>
      {children}
    </EntraIdAuthProvider>
  );
}
```

While `useEntraIdInit` resolves the session, the provider renders a centered
`Spinner` with a localized `Auth.Initializing` label instead of `children`. Once
resolved it publishes `{ keycloak: null, authenticated, loading, user, login,
logout }` into `AuthContext.Provider`. The `login` callback automatically passes
the current `i18n.language` as the `locale`, so the IdP login page opens in the
user's active UI language.

## Public API

| Symbol                     | Kind      | Purpose                                                                                                                    |
| -------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `EntraIdAuthProvider`      | component | Mounts `useEntraIdInit`, gates `children` behind an init spinner, publishes the resolved auth state into the app's context |
| `EntraIdAuthProviderProps` | type      | `{ context, config, children }` — the app's auth `Context`, the `EntraIdCoreConfig`, and the subtree                       |

The two props are typed as:

- `context: Context<KeycloakAuthContextType | undefined>` — the
  `createAuthContext` instance the app shares across auth modes.
- `config: EntraIdCoreConfig` — Azure AD app-registration settings
  (`clientId`, `authority`, `redirectUri`, optional `scopes`, `cacheLocation`,
  and the `onAcquireTokenFailure` / `onSessionEnd` callbacks), owned by
  [`@granit/authentication-entraid`](../authentication-entraid).

## Caveats

- **Token cache location is `'memory'` by default.** `EntraIdCoreConfig`
  defaults `cacheLocation` to `'memory'` so MSAL OIDC tokens are not readable by
  same-origin JavaScript (XSS, malicious browser extensions). Overriding to
  `'sessionStorage'` / `'localStorage'` is a known high-severity risk (CWE-922)
  and should only be done with an XSS-hardened CSP; for persistent cross-tab
  sessions prefer the BFF cookie pattern (`@granit/bff`). This package forwards
  the config unchanged — the default and the warning are owned upstream.
- **Context shape is `KeycloakAuthContextType`, not an Entra-specific type.**
  This is intentional so Entra ID and Keycloak providers are mount-swappable
  behind one app context; the provider sets `keycloak: null`. It does **not**
  expose the live MSAL `PublicClientApplication` instance — consumers needing the
  MSAL ref use `useEntraIdInit` directly from
  [`@granit/react-authentication-entraid`](../react-authentication-entraid).

## Out of scope

- **MSAL lifecycle** (instantiation, silent SSO, token acquisition, Bearer
  wiring) — owned by `useEntraIdInit` in
  [`@granit/react-authentication-entraid`](../react-authentication-entraid).
- **Config types and the security defaults** — owned by
  [`@granit/authentication-entraid`](../authentication-entraid).
- **Login pages** — Entra ID hosts its own login UI; this package only
  redirects. (OpenIddict-style login screens live in
  [`@granit/react-ui-authentication-local`](../react-ui-authentication-local).)
- **User / role management** — backed by the separate `Granit.Identity` module
  (`contracts/openapi/identity.json`), unrelated to this IdP wiring.

## License

Apache-2.0
