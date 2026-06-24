# @granit/authentication-keycloak

Framework-agnostic **type contract** for Keycloak OIDC authentication — the shared
shape the React layer and consuming apps build on. It carries no React, DOM or
Node-only dependency: it is a pure `import type` surface (the barrel re-exports
nothing but `type`s), so it adds zero runtime weight.

It is one provider in the `@granit/authentication` family. The provider-agnostic
base ([`@granit/authentication`](../authentication)) defines `BaseAuthContextType`
and the standard `OidcUserInfo` claims; this package specializes them for Keycloak
by adding the live `keycloak-js` instance to the context and a strongly-typed
config + lifecycle-event vocabulary. The runtime that fulfils this contract lives
one layer up:

- [`@granit/react-authentication-keycloak`](../react-authentication-keycloak) —
  the `useKeycloakInit` hook that boots `keycloak-js` and produces a value
  assignable to `KeycloakAuthContextType`.
- [`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak) —
  the `KeycloakAuthProvider` admin feature kit that wires the hook into context.

There is **no backend counterpart**: Keycloak is the external identity provider,
and the OIDC flow it drives is a browser ↔ Keycloak concern, not a Granit `.NET`
endpoint.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, no install
step. A consumer must declare these peers:

- `@granit/authentication` — provides `BaseAuthContextType` and `OidcUserInfo`,
  which the exported types extend / alias.
- `keycloak-js` (`^26`) — the `Keycloak` type referenced by
  `KeycloakAuthContextType.keycloak`.

## Quick start

This package ships types only — you import them to annotate the context, config
and event handlers consumed by the React layer.

```ts
import type {
  KeycloakAuthContextType,
  KeycloakCoreConfig,
  KeycloakEvent,
  KeycloakUserInfo,
} from '@granit/authentication-keycloak';

// Strongly-typed init config — url/realm/clientId are required, the rest opt-in.
const config: KeycloakCoreConfig = {
  url: 'https://id.example.com',
  realm: 'granit',
  clientId: 'admin-spa',
  // Read claims straight from the access token instead of a /userinfo call —
  // requires the Keycloak client mappers to emit them.
  useTokenClaims: true,
  onTokenExpired: () => keycloak?.updateToken(30),
  onEvent: (event: KeycloakEvent, error?: unknown) => {
    if (event === 'onAuthError') reportAuthFailure(error);
  },
};

// The context value the provider exposes — base auth fields plus the live
// keycloak-js instance (null until init completes).
function readSubject(ctx: KeycloakAuthContextType): string | undefined {
  const user: KeycloakUserInfo | null = ctx.user;
  return user?.sub;
}
```

## Public API

| Symbol                    | Kind | Purpose                                                                |
| ------------------------- | ---- | ---------------------------------------------------------------------- |
| `KeycloakAuthContextType` | type | `BaseAuthContextType` plus a nullable live `keycloak-js` instance      |
| `KeycloakCoreConfig`      | type | `useKeycloakInit` config — `url`/`realm`/`clientId` + SSO & event opts |
| `KeycloakEvent`           | type | Union of forwarded lifecycle names (`onReady`, `onAuthSuccess`, …)     |
| `KeycloakUserInfo`        | type | Alias of `OidcUserInfo` (standard OIDC claims) — `sub` + profile       |

`KeycloakCoreConfig` flags worth noting: `silentCheckSso` (default `true`,
web-only — skip on native), `silentCheckSsoFallback` (default `true` — fall back
to a `check-sso` redirect when the silent iframe is blocked, e.g. Safari third-party
cookie blocking), `useTokenClaims` (default `false` — `loadUserInfo()` vs decoding
`tokenParsed`), plus the `onTokenExpired` / `onAuthRefreshError` / `onAuthLogout` /
`onEvent` callbacks.

## Out of scope / caveats

- **No runtime.** There is no provider, hook, component or HTTP call here — only
  types. Importing this package must never pull `keycloak-js` into a bundle. The
  init logic and the React context live in the sibling packages above.
- **Client checks are a UX hint, not a security boundary.** `authenticated` /
  `user` reflect the browser-side Keycloak session; every protected `.NET`
  endpoint re-validates the bearer token server-side. Never gate sensitive data
  on the context alone — see [`@granit/react-authorization`](../react-authorization)
  for the enforcement-vs-gating split.
- **Type stability.** These symbols are consumed by apps and by the React layer;
  treat them as a contract — extend rather than rename, and never break the
  `BaseAuthContextType` extension chain without coordinating the dependents.
- **`KeycloakUserInfo` is an alias**, not a new shape. It is exactly
  `OidcUserInfo`; only `sub` is guaranteed, all profile claims are optional and
  depend on the realm's scopes and client mappers.

## License

Apache-2.0
