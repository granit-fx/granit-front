# @granit/react-ui-authentication-cognito

The **AWS Cognito auth provider** for Granit apps. Wires
[`@granit/react-authentication-cognito`](../react-authentication-cognito)'s
`useCognitoInit` into the app's auth context, forwards the active UI locale to
the Hosted-UI login, and renders an init spinner until the session resolves.

This is the **react-ui** layer of the Cognito auth split: the smallest of three
packages over the same AWS Cognito provider. It holds the app-facing wiring
component only — no session logic, no PKCE, no DTOs.

- [`@granit/authentication-cognito`](../authentication-cognito) — framework-agnostic
  core: `CognitoCoreConfig` + `CognitoAuthContextType` (extend the shared
  `BaseAuthContextType` from [`@granit/authentication`](../authentication)).
- [`@granit/react-authentication-cognito`](../react-authentication-cognito) — React
  hooks layer: `useCognitoInit` (UserPool instantiation, session restore, token
  refresh wired to `@granit/api-client`) plus the Hosted-UI PKCE callback helpers.
- `@granit/react-ui-authentication-cognito` (this package) — the mountable
  `CognitoAuthProvider` an app drops in once it has selected the Cognito auth-mode.

It is the Cognito companion to
[`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak):
both IdPs host their own login UI, so each package ships only the **provider**, not
login pages (unlike [`@granit/react-ui-authentication-local`](../react-ui-authentication-local),
which carries the OpenIddict login screens).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. A consumer must declare these peers:

- `@granit/react-authentication-cognito` — supplies `useCognitoInit`, the session
  engine this provider mounts.
- `@granit/authentication-cognito` — the `CognitoCoreConfig` type accepted by the
  `config` prop.
- `@granit/authentication-keycloak` — the `KeycloakAuthContextType` shape the provider
  fills (the shared `BaseAuthContextType`-derived context the app threads through).
- `@granit/authentication` — the shared auth base (`createAuthContext`, login/logout
  option types).
- `@granit/react-localization` — `useTranslation`, used to label the spinner and pass
  `i18n.language` to the IdP login.
- `@granit/react-ui` — the `Spinner` shown during init.
- `react` (`^19`).

## Quick start

Mount the provider once, above the app, under the auth context the host created with
`createAuthContext`. The provider resolves the Cognito session via `useCognitoInit`,
publishes the standard `{ authenticated, loading, user, login, logout }` value into
that context, and gates children behind a full-screen init spinner.

```tsx
import { CognitoAuthProvider } from '@granit/react-ui-authentication-cognito';

import type { CognitoCoreConfig } from '@granit/authentication-cognito';

import { AuthContext } from './auth-context'; // your createAuthContext() instance
import { App } from './app';

const cognitoConfig: CognitoCoreConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  region: import.meta.env.VITE_COGNITO_REGION,
  domain: import.meta.env.VITE_COGNITO_DOMAIN, // Hosted-UI OAuth domain
  // tokenStorage defaults to 'memory' — see Caveats before overriding.
};

export function Root() {
  return (
    <CognitoAuthProvider context={AuthContext} config={cognitoConfig}>
      <App />
    </CognitoAuthProvider>
  );
}
```

`login()` forwards the current `i18n.language` as the `locale` option, so the Cognito
Hosted UI opens in the user's active UI language. The app owns its context instance and
decides — via its auth-mode — whether to mount this provider; the package owns the
reusable wiring.

## Public API

| Symbol                     | Kind     | Purpose                                                                                                         |
| -------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `CognitoAuthProvider`      | provider | Mounts `useCognitoInit`, publishes the auth value into the app's context, gates children behind an init spinner |
| `CognitoAuthProviderProps` | type     | `{ context, config, children }`: the app's auth context, a `CognitoCoreConfig`, and the subtree                 |

`context` is the `Context<KeycloakAuthContextType | undefined>` returned by the app's
`createAuthContext`; both the Cognito and Keycloak providers fill the same
`BaseAuthContextType`-derived shape, so the consuming app reads auth identically
regardless of the active IdP. `config` is re-exported from
[`@granit/authentication-cognito`](../authentication-cognito).

## Out of scope / caveats

- **Token storage defaults to in-memory.** `useCognitoInit` keeps Cognito's id /
  access / refresh tokens in a per-tab in-memory store (`CognitoCoreConfig.tokenStorage`
  defaults to `'memory'`) so no same-origin script can lift the refresh token. Setting
  `tokenStorage` to `'localStorage'` / `'sessionStorage'` is a known high-severity risk
  (CWE-922) — override only with an XSS-hardened CSP, and prefer the BFF cookie pattern
  ([`@granit/bff`](../bff)) for durable cross-tab sessions.
- **No login pages.** Cognito hosts its own login UI; this package only redirects to it
  (PKCE / `state` / `nonce` are built by the hooks layer). It ships no forms, no
  callback route — handle the Hosted-UI redirect with the PKCE helpers in
  [`@granit/react-authentication-cognito`](../react-authentication-cognito).
- **App-agnostic, single-provider.** The host owns the context instance and mounts at
  most one IdP provider per auth-mode; this package does not select or switch IdPs.
- **Session engine lives one layer down.** UserPool instantiation, session restore,
  token refresh, and `@granit/api-client` Bearer wiring are
  [`@granit/react-authentication-cognito`](../react-authentication-cognito)'s job; this
  package only adapts that hook to a context provider with a locale-aware login and a
  loading gate.

## License

Apache-2.0
</content>
</invoke>
