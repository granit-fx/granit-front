# @granit/authentication-entraid

Microsoft Entra ID (Azure AD) OIDC **provider core** — the framework-level
TypeScript contract for an Entra ID authenticated session. It widens the
provider-agnostic [`@granit/authentication`](../authentication) base with the
MSAL instance and the Entra-specific configuration bag. Like its parent, it
holds **only TypeScript interfaces**: no React, no DOM, no runtime code, no HTTP
client. The MSAL SDK appears solely as a type-level peer (`IPublicClientApplication`).

This is the provider-core layer of the Entra ID auth split:

| Layer                  | Package                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Provider-agnostic base | [`@granit/authentication`](../authentication)                                                                                           |
| Provider core (this)   | `@granit/authentication-entraid`                                                                                                        |
| React hook             | [`@granit/react-authentication-entraid`](../react-authentication-entraid) — `useEntraIdInit` (MSAL bootstrap, silent SSO, token wiring) |
| Admin UI feature kit   | [`@granit/react-ui-authentication-entraid`](../react-ui-authentication-entraid) — `EntraIdAuthProvider` (context wiring + init spinner) |

There is **no Granit backend counterpart**: Entra ID is an external identity
provider (`login.microsoftonline.com`), so the contract is the OIDC/OAuth2
protocol, not a `Granit.*` module. Authorization (permission checks, role
grants) is a separate concern — see [`@granit/authorization`](../authorization).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not from a
registry. Declare these peers in the consuming package:

- `@azure/msal-browser` (`>=3.0.0`) — supplies the `IPublicClientApplication`
  type referenced by `EntraIdAuthContextType`.
- `@granit/authentication` (`workspace:*`) — the `BaseAuthContextType` this
  package extends.

## Quick start

`EntraIdCoreConfig` is the host-supplied configuration; `EntraIdAuthContextType`
is the widened session shape consumed downstream. The React hook
[`useEntraIdInit`](../react-authentication-entraid) turns the config into a live
context value — this core package only types the contract on both ends.

```ts
import type { EntraIdAuthContextType, EntraIdCoreConfig } from '@granit/authentication-entraid';

// Host environment config (from the Azure app registration).
const config: EntraIdCoreConfig = {
  clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
  authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_TENANT_ID}`,
  redirectUri: `${window.location.origin}/auth/callback`,
  scopes: ['openid', 'profile', 'email'],
  onAcquireTokenFailure: () => redirectToLogin(),
  // cacheLocation defaults to 'memory' — see caveats below.
};

// The widened session shape: base context + the live MSAL instance.
function readSession(auth: EntraIdAuthContextType) {
  if (!auth.authenticated || auth.msalInstance === null) return null;
  return auth.user; // OidcUserInfo | null
}
```

To bootstrap MSAL and mount the context, use the sibling React packages:

```tsx
import { EntraIdAuthProvider } from '@granit/react-ui-authentication-entraid';

<EntraIdAuthProvider context={AuthContext} config={config}>
  <App />
</EntraIdAuthProvider>;
```

## Public API

| Symbol | Kind | Purpose | |
| ------------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | |
| `EntraIdAuthContextType` | type | `BaseAuthContextType` widened with `msalInstance: IPublicClientApplication \                                                                                    | null` (null before init completes) |
| `EntraIdCoreConfig` | type | Entra app-registration config: `clientId`, `authority`, `redirectUri` (required); `scopes`, `cacheLocation`, `onAcquireTokenFailure`, `onSessionEnd` (optional) | |

## Out of scope / caveats

- **No runtime, no SDK init.** This package ships interfaces only. It instantiates
  no `PublicClientApplication`, performs no redirect, and acquires no token —
  that behaviour lives in [`@granit/react-authentication-entraid`](../react-authentication-entraid)
  (`useEntraIdInit`) and the UI provider.
- **Token storage defaults to in-memory.** `cacheLocation` defaults to `'memory'`
  so OIDC tokens are **not** readable by same-origin JavaScript (XSS, malicious
  browser extensions). Override to `'sessionStorage'` / `'localStorage'` only when
  cross-tab persistence is required **and** the app ships an XSS-hardened CSP —
  persisting tokens in web storage is a known high-severity risk (CWE-922). For
  persistent sessions, prefer the BFF cookie pattern ([`@granit/bff`](../bff))
  instead.
- **`user` is a UX projection, not an authorization source.** The `user` field
  (`OidcUserInfo`) carries display claims only. Never derive access decisions from
  it client-side — the backend (`Granit.Authorization`) is the only authoritative
  check. See [`@granit/react-authorization`](../react-authorization) for the
  gating-vs-enforcement model.
- **Claims are PII.** ID-token claims surfaced on `user` (`email`, `name`, `sub`,
  …) are personal data — do not log them or persist them beyond the active session.
- **Stability.** These types are consumed across the auth family and by apps;
  treat them as a shared contract. Widen by extension, never by renaming or
  removing fields without a deprecation path.

## License

Apache-2.0
