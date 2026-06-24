# @granit/authentication-cognito

Framework-agnostic **AWS Cognito User Pools** authentication contract — the
provider-specific layer of the Granit auth stack for apps that delegate identity
to a Cognito User Pool (OIDC, Hosted UI). It holds only TypeScript types: the
auth-context shape and the configuration object. No React, DOM or runtime code.

It extends the generic
[`@granit/authentication`](../authentication) `BaseAuthContextType` with the live
Cognito `UserPool` handle, and defines `CognitoCoreConfig` — the pool / client /
region / OAuth inputs every Cognito-backed app must supply. The actual identity
provider is **AWS Cognito** itself (no Granit backend module); tokens are issued
and validated by Cognito, the BFF or the API gateway, not by this package.

Sibling-package split (each layer depends only on the one below):

- **core (this package)** — types only: `CognitoAuthContextType`, `CognitoCoreConfig`.
- [`@granit/react-authentication-cognito`](../react-authentication-cognito) — the
  `useCognitoInit` hook plus PKCE / Hosted-UI authorization-transaction helpers
  (`buildCognitoAuthorizeUrl`, `generatePkce`, `readCognitoAuthTransaction`, …).
- [`@granit/react-ui-authentication-cognito`](../react-ui-authentication-cognito) —
  the `CognitoAuthProvider` that wires the hook into a React context.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, no
publish step for app consumers. Declare these peers:

- `@granit/authentication` (`workspace:*`) — supplies `BaseAuthContextType`.
- `amazon-cognito-identity-js` (`>=6.0.0`) — supplies the `CognitoUserPool` type.

## Quick start

This is a contract package: you extend the context type in your app's auth
provider and pass a `CognitoCoreConfig` to the React layer.

```ts
import type {
  CognitoAuthContextType,
  CognitoCoreConfig,
} from '@granit/authentication-cognito';

// App-level config — region / pool / client come from env, never hard-coded.
const config: CognitoCoreConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID, // e.g. eu-west-1_XXXXXXXXX
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  region: 'eu-west-1',
  domain: 'myapp.auth.eu-west-1.amazoncognito.com',
  scopes: ['openid', 'email', 'profile'],
  // tokenStorage defaults to 'memory' — see the caveat below before changing it.
  onSessionExpired: () => location.assign('/login'),
};

// Apps may extend the context further with app-specific fields.
interface AppAuthContext extends CognitoAuthContextType {
  tenantId: string | null;
}
```

`CognitoAuthContextType` adds `userPool: CognitoUserPool | null` (null until init
completes) on top of the base `authenticated` / `loading` / `user` / `login` /
`logout` surface. Consume the live context through `CognitoAuthProvider` from
[`@granit/react-ui-authentication-cognito`](../react-ui-authentication-cognito).

## Public API

| Symbol                   | Kind | Purpose                                                     |
| ------------------------ | ---- | ----------------------------------------------------------- |
| `CognitoAuthContextType` | type | `BaseAuthContextType` + `userPool: CognitoUserPool \| null` |
| `CognitoCoreConfig`      | type | Pool / client / region / OAuth + token-storage & callbacks  |

`CognitoCoreConfig` fields: `userPoolId`, `clientId`, `region` (required);
`domain`, `scopes`, `tokenStorage`, `onTokenRefreshError`, `onSessionExpired`
(optional).

## Caveats

- **Token storage defaults to `'memory'`.** The Cognito SDK keeps the id, access
  **and the long-lived refresh token** wherever `tokenStorage` points. `'memory'`
  keeps them unreadable by same-origin JavaScript (XSS, malicious extensions).
  Override to `'sessionStorage'` / `'localStorage'` only when cross-tab or
  cross-reload persistence is required **and** the app ships an XSS-hardened CSP.
  Persisting tokens in web storage is a known high-severity risk (CWE-922) — see
  security audit VULN-102. For durable sessions, prefer the BFF cookie pattern
  ([`@granit/bff`](../bff)) over a browser-resident refresh token.

- **No enforcement here.** This package only models the client-side auth state.
  Authentication and authorization decisions are made by Cognito and the
  backend / gateway that validates the tokens — never by inspecting
  `authenticated` in the browser.

- **Types only.** Runtime wiring (PKCE, Hosted-UI callback handling, the React
  provider) lives in the two sibling packages above. Reach for those, not this
  one, to actually sign a user in.

## License

Apache-2.0
