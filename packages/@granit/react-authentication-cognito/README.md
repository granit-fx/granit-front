# @granit/react-authentication-cognito

React hooks for **AWS Cognito** OIDC authentication. This is the React layer of
the Cognito auth split: it instantiates the `amazon-cognito-identity-js`
UserPool, restores and refreshes the session, projects the standard OIDC claims,
wires the Bearer token into `@granit/api-client`, and drives the Hosted-UI
Authorization-Code + PKCE login redirect.

The framework-agnostic **core** (`CognitoCoreConfig`, `CognitoAuthContextType`)
lives in [`@granit/authentication-cognito`](../authentication-cognito); the
ready-to-mount **react-ui** provider (`CognitoAuthProvider`, init spinner, locale
forwarding) lives in [`@granit/react-ui-authentication-cognito`](../react-ui-authentication-cognito).
This package is the hooks layer in between. Cognito is an external AWS Identity
Provider — there is **no** Granit backend module or OpenAPI contract behind it;
the generic auth context factory comes from
[`@granit/react-authentication`](../react-authentication).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption. Declare these peers:

- `@granit/authentication` — `BaseAuthContextType`, `LoginOptions`,
  `LogoutOptions`, `OidcUserInfo`.
- `@granit/authentication-cognito` — `CognitoCoreConfig`, `CognitoAuthContextType`.
- `@granit/react-authentication` — `createAuthContext` (the app's typed context).
- `@granit/api-client` — receives the token getter and unauthorized handler.
- `@granit/logger` — `createLogger` for runtime logging.
- `amazon-cognito-identity-js` (`>=6.0.0`) — the Cognito SDK (UserPool, storage).
- `react` (`^19`).

## Quick start

Most apps mount the prebuilt [`CognitoAuthProvider`](../react-ui-authentication-cognito)
rather than calling the hook directly. Use `useCognitoInit` when you wire the
context yourself:

```tsx
import { createAuthContext } from '@granit/react-authentication';
import { useCognitoInit } from '@granit/react-authentication-cognito';

import type { CognitoAuthContextType } from '@granit/authentication-cognito';

const { AuthContext, useAuth } = createAuthContext<CognitoAuthContextType>();

function CognitoProvider({ children }: { children: React.ReactNode }) {
  // `tokenStorage` defaults to 'memory' — see caveats before overriding.
  const auth = useCognitoInit({
    userPoolId: 'eu-west-1_XXXXXXXXX',
    clientId: '7example0clientid',
    region: 'eu-west-1',
    domain: 'myapp.auth.eu-west-1.amazoncognito.com', // required for login()
    scopes: ['openid', 'profile', 'email'],
  });

  if (auth.loading) return null; // session restore in flight
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

function LoginButton() {
  const { authenticated, login, logout, user } = useAuth();
  return authenticated ? (
    <button onClick={() => logout()}>Sign out {user?.email}</button>
  ) : (
    <button onClick={() => login()}>Sign in</button>
  );
}
```

`login()` derives the S256 PKCE challenge, mints single-use `state` + `nonce`,
persists the transaction in `sessionStorage`, and redirects to the Hosted UI. On
the callback route, read and validate the transaction, then clear it:

```ts
import {
  readCognitoAuthTransaction,
  clearCognitoAuthTransaction,
} from '@granit/react-authentication-cognito';

const tx = readCognitoAuthTransaction(); // { verifier, state, nonce } | null
if (tx && tx.state === urlParams.get('state')) {
  // exchange urlParams.get('code') + tx.verifier at the token endpoint…
  clearCognitoAuthTransaction(); // single-use
}
```

## Public API

| Symbol                        | Kind  | Purpose                                                            |
| ----------------------------- | ----- | ------------------------------------------------------------------ |
| `useCognitoInit`              | hook  | Init UserPool, restore/refresh session, wire token to api-client   |
| `CognitoCoreResult`           | type  | Hook return: context + `userPoolRef`, `login`, `logout`            |
| `buildCognitoAuthorizeUrl`    | fn    | Build the Hosted-UI authorize URL (PKCE S256, `state`, `nonce`)    |
| `generatePkce`                | fn    | Generate a `{ verifier, challenge }` PKCE pair (RFC 7636)          |
| `randomToken`                 | fn    | Cryptographically random URL-safe token (verifier/`state`/`nonce`) |
| `readCognitoAuthTransaction`  | fn    | Read the in-flight auth transaction from `sessionStorage`          |
| `clearCognitoAuthTransaction` | fn    | Remove the stored transaction (single-use)                         |
| `COGNITO_AUTH_TX_KEY`         | const | `sessionStorage` key holding the in-flight transaction             |
| `CognitoAuthTransaction`      | type  | `{ verifier, state, nonce }` carried across the IdP redirect       |
| `PkcePair`                    | type  | `{ verifier, challenge }` returned by `generatePkce`               |

`persistCognitoAuthTransaction` is internal (used by `login()`); the callback
side reads via `readCognitoAuthTransaction`.

## Out of scope / caveats

- **Token storage defaults to memory.** `tokenStorage` defaults to `'memory'`
  so the id/access/**refresh** tokens are never readable by same-origin
  JavaScript (XSS, malicious extensions). Override to `'sessionStorage'` /
  `'localStorage'` only when cross-tab or cross-reload persistence is required
  **and** the app ships an XSS-hardened CSP — persisting tokens in web storage is
  a known high-severity risk (CWE-922; security audit VULN-102). For durable
  sessions prefer the BFF cookie pattern (`@granit/bff`).
- **PKCE is mandatory.** As a public SPA client, `login()` always uses
  Authorization-Code + PKCE (S256) with single-use `state` and `nonce`
  (RFC 7636 / RFC 9700; VULN-103 / VULN-301). All authorize-URL parameters are
  encoded via `URLSearchParams`.
- **`login()` needs `domain`.** Without `domain` in the config, `login()` is a
  no-op — the Hosted-UI redirect cannot be built.
- **No token exchange here.** This package builds the authorize URL and persists
  the verifier; the callback-side `code` → token exchange and `state`/`nonce`
  validation are the host app's responsibility.
- **No backend contract.** Cognito is an external AWS IdP; there is no
  `Granit.*` endpoint or `contracts/openapi/*.json` for this package.

## License

Apache-2.0
