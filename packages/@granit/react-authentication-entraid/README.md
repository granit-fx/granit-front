# @granit/react-authentication-entraid

React hook layer for Microsoft Entra ID (Azure AD) OIDC authentication. It turns
the static [`@granit/authentication-entraid`](../authentication-entraid) provider
core into a live session: `useEntraIdInit` instantiates an MSAL
`PublicClientApplication`, runs the silent SSO / redirect dance, extracts the
user from the ID-token claims, and wires the Bearer-token getter into
[`@granit/api-client`](../api-client). It owns the MSAL bootstrap and the
`@azure/msal-browser` runtime dependency — no DOM rendering, no JSX.

This is the **React hooks** layer of the Entra ID auth split. There is **no
Granit backend counterpart**: Entra ID is an external identity provider
(`login.microsoftonline.com`), so the contract is the OIDC/OAuth2 protocol, not
a `Granit.*` module.

| Layer                  | Package                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| Provider-agnostic base | [`@granit/authentication`](../authentication)                                                                 |
| Provider core          | [`@granit/authentication-entraid`](../authentication-entraid) — `EntraIdAuthContextType`, `EntraIdCoreConfig` |
| React hook (this)      | `@granit/react-authentication-entraid` — `useEntraIdInit`                                                     |
| Admin UI feature kit   | [`@granit/react-ui-authentication-entraid`](../react-ui-authentication-entraid) — `EntraIdAuthProvider`       |

Most apps consume the UI provider, not this hook directly — `EntraIdAuthProvider`
already wires `useEntraIdInit` into the app's auth context and renders an init
spinner. Reach for this package when you need custom context wiring or a headless
integration.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not from a
registry. Declare these peers in the consuming package:

- `@azure/msal-browser` (`>=3.0.0`) — the MSAL SDK; this hook instantiates
  `PublicClientApplication` and reacts to `InteractionRequiredAuthError`.
- `@granit/api-client` (`workspace:*`) — receives the token getter and the
  on-unauthorized handler via `setTokenGetter` / `setOnUnauthorized`.
- `@granit/authentication` (`workspace:*`) — `LoginOptions`, `LogoutOptions`,
  `OidcUserInfo`.
- `@granit/authentication-entraid` (`workspace:*`) — `EntraIdCoreConfig` (input)
  and `EntraIdAuthContextType` (extended by the result).
- `@granit/react-authentication` (`workspace:*`) — shared React auth surface.
- `@granit/logger` (`workspace:*`) — init failures are logged via `createLogger`.
- `react` (`^19.0.0`).

## Quick start

```tsx
import { useEntraIdInit } from '@granit/react-authentication-entraid';

import type { EntraIdCoreConfig } from '@granit/authentication-entraid';

const config: EntraIdCoreConfig = {
  clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
  authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_TENANT_ID}`,
  redirectUri: `${window.location.origin}/auth/callback`,
  scopes: ['openid', 'profile', 'email'],
  onAcquireTokenFailure: () => console.warn('silent token refresh needs interaction'),
  // cacheLocation defaults to 'memory' — see caveats below.
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { authenticated, loading, user, login, logout } = useEntraIdInit(config);

  if (loading) return <p>Initializing…</p>;

  if (!authenticated) {
    return <button onClick={() => login()}>Sign in with Microsoft</button>;
  }

  // `user` is OidcUserInfo | null — display claims only, never an auth source.
  return (
    <>
      <span>{user?.name ?? user?.email}</span>
      <button onClick={() => logout()}>Sign out</button>
      {children}
    </>
  );
}
```

`useEntraIdInit` calls `setTokenGetter` so every `@granit/api-client` request
attaches a freshly acquired Bearer token, and `setOnUnauthorized` so a 401 from
the API triggers an MSAL logout redirect. You do not pass tokens around manually.

To mount the result into the app's auth context with a built-in init spinner,
prefer the UI sibling:

```tsx
import { EntraIdAuthProvider } from '@granit/react-ui-authentication-entraid';

<EntraIdAuthProvider context={AuthContext} config={config}>
  <App />
</EntraIdAuthProvider>;
```

## Public API

| Symbol              | Kind | Purpose                                                                                                 |
| ------------------- | ---- | ------------------------------------------------------------------------------------------------------- |
| `useEntraIdInit`    | hook | Bootstraps MSAL from `EntraIdCoreConfig`: silent SSO, redirect handling, claim extraction, token wiring |
| `EntraIdCoreResult` | type | `useEntraIdInit` return: `EntraIdAuthContextType` plus `msalRef`, `login(options?)`, `logout(options?)` |

`useEntraIdInit(config: EntraIdCoreConfig)` returns an `EntraIdCoreResult`:

- `authenticated` / `loading` — session state; `loading` settles to `false` once
  init resolves, even when MSAL throws or no account exists.
- `user: OidcUserInfo | null` — standard OIDC claims extracted from the ID token
  (`sub` falls back to the `oid` claim, `email` to the MSAL `username`).
- `login(options?: LoginOptions)` / `logout(options?: LogoutOptions)` — trigger
  the MSAL redirect; `login` forwards `loginHint` / `prompt` / `redirectUri`,
  `logout` forwards `redirectUri` (mapped to MSAL's `postLogoutRedirectUri`).
- `msalInstance` / `msalRef` — the live `PublicClientApplication` (null before
  init completes); the ref is the escape hatch for advanced MSAL calls.

## Out of scope / caveats

- **Token storage defaults to in-memory.** `config.cacheLocation` defaults to
  `'memory'`, so OIDC tokens are **not** readable by same-origin JavaScript (XSS,
  malicious browser extensions). Override to `'sessionStorage'` / `'localStorage'`
  only when cross-tab persistence is required **and** the app ships an XSS-hardened
  CSP — persisting tokens in web storage is a known high-severity risk (CWE-922).
  For persistent sessions, prefer the BFF cookie pattern ([`@granit/bff`](../bff)).
- **`user` is a UX projection, not an authorization source.** `OidcUserInfo`
  carries display claims only. Never derive access decisions from it client-side —
  the backend (`Granit.Authorization`) is the only authoritative check. See
  [`@granit/react-authorization`](../react-authorization) for the gating-vs-enforcement
  model.
- **Claims are PII.** ID-token claims surfaced on `user` (`email`, `name`, `sub`,
  …) are personal data — do not log them or persist them beyond the active session.
- **Single bootstrap.** The hook initializes MSAL exactly once per mount (guarded
  by an internal ref); changing `clientId` / `authority` / `redirectUri` after the
  first render does not re-initialize the instance.
- **Silent-token failures are swallowed.** When `acquireTokenSilent` fails the
  getter resolves to `undefined`; on `InteractionRequiredAuthError` it additionally
  calls `config.onAcquireTokenFailure`. Other errors resolve silently — the API
  request then proceeds without a Bearer token and is rejected server-side.
- **Context wiring lives in the UI kit.** This hook does not create or populate a
  React context, render a spinner, or forward the UI locale to the IdP — that is
  [`@granit/react-ui-authentication-entraid`](../react-ui-authentication-entraid)'s
  `EntraIdAuthProvider`.

## License

Apache-2.0
