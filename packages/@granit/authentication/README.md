# @granit/authentication

Provider-agnostic **OIDC authentication contract** — the framework-level base
types every auth provider and consuming app extends. It is the JS/TS counterpart
of the .NET `Granit.Authentication` module, but holds **only TypeScript
interfaces**: no React, no DOM, no runtime code, no HTTP client.

It defines the shared shape of an authenticated session (`BaseAuthContextType`),
the standard OIDC user claims (`OidcUserInfo`), and the generic login/logout
option bags forwarded to any identity provider. Provider-specific packages widen
`BaseAuthContextType` (e.g. [`@granit/authentication-keycloak`](../authentication-keycloak)
adds `keycloak`), the React layer turns it into a typed context
([`@granit/react-authentication`](../react-authentication)), and apps extend it
further with app-specific fields.

This is the root of a deliberately layered family:

- **Core contract** (this package) — `@granit/authentication`.
- **Provider cores** — [`-keycloak`](../authentication-keycloak),
  [`-local`](../authentication-local), [`-cognito`](../authentication-cognito),
  [`-entraid`](../authentication-entraid),
  [`-google-cloud`](../authentication-google-cloud),
  [`-api-keys`](../authentication-api-keys).
- **React hooks/providers** — [`react-authentication`](../react-authentication),
  plus one `react-authentication-*` per provider and
  [`-mock`](../react-authentication-mock).
- **Admin UI feature kits** — one
  [`react-ui-authentication-*`](../react-ui-authentication-keycloak) per provider.

Authorization (permission checks, role grants) is a separate concern —
see [`@granit/authorization`](../authorization) and
[`@granit/react-authorization`](../react-authorization).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not from a
registry. It is a pure-types package and declares **no peer dependencies**;
nothing to install in the consumer beyond the alias itself.

## Quick start

`BaseAuthContextType` is the extension point. Provider packages and apps widen
it; `createAuthContext` from [`@granit/react-authentication`](../react-authentication)
turns the widened type into a typed React context.

```ts
import type { BaseAuthContextType, OidcUserInfo, LoginOptions } from '@granit/authentication';

// An app extends the base with app-specific session fields.
interface AppAuthContextType extends BaseAuthContextType {
  hasAdminRole: boolean;
}

// Building the context value (e.g. inside a provider component).
const auth: AppAuthContextType = {
  authenticated: true,
  loading: false,
  user: { sub: 'a1b2', email: 'alice@example.com', preferred_username: 'alice' },
  login: (options?: LoginOptions) => redirectToIdp(options),
  logout: () => redirectToLogout(),
  hasAdminRole: false,
};

// Login can steer the IdP without coupling to any provider SDK.
auth.login({ idpHint: 'azure', locale: 'fr', prompt: 'login' });

function greet(user: OidcUserInfo | null): string {
  return user ? user.name ?? user.preferred_username ?? user.sub : 'guest';
}
```

To get a typed context + `useAuth` hook from the widened type:

```ts
import { createAuthContext } from '@granit/react-authentication';

export const { AuthContext, useAuth } = createAuthContext<AppAuthContextType>();
```

## Public API

| Symbol                | Kind | Purpose                                                                                                          |
| --------------------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| `BaseAuthContextType` | type | Shared session base — `authenticated`, `loading`, `user`, `login`, `logout`; extended by every provider          |
| `OidcUserInfo`        | type | Standard OIDC user claims — `sub` required, profile fields (`email`, `name`, …) optional                         |
| `LoginOptions`        | type | Generic login bag forwarded to the IdP — `idpHint`, `loginHint`, `locale`, `action`, `prompt`, `scope`, `maxAge` |
| `LogoutOptions`       | type | Generic logout bag — `redirectUri`                                                                               |

## Out of scope / caveats

- **No runtime, no SDK.** This package ships interfaces only. It performs no
  login redirect, holds no token, and depends on no Keycloak/Cognito/Entra SDK.
  Provider behaviour lives in the `authentication-*` and `react-authentication-*`
  packages.
- **`BaseAuthContextType` deliberately omits `keycloak`** (and any other
  provider field). Keeping the base provider-agnostic is enforced by a type test;
  provider couplings belong in the provider core (`@granit/authentication-keycloak`
  exposes `KeycloakAuthContextType`, `KeycloakCoreConfig`, `KeycloakEvent`,
  `KeycloakUserInfo`).
- **Stability.** These types are consumed across the auth family and by apps;
  treat them as a shared contract. Widen by extension, never by renaming or
  removing fields without a deprecation path.
- **`user` is a UX projection, not an authorization source.** `OidcUserInfo`
  carries display claims only. Never derive access decisions from it client-side —
  the backend (`Granit.Authorization`) is the only authoritative check. See
  [`@granit/react-authorization`](../react-authorization) for the gating-vs-enforcement
  model.
- **Claims are PII.** `OidcUserInfo` fields (`email`, `name`, `sub`, …) are
  personal data — do not log them or persist them beyond the active session.

## License

Apache-2.0
