# @granit/react-authentication

Provider-agnostic **React bindings** for `@granit/authentication` — a typed auth
**context factory** and a **mock provider**, with no dependency on any identity
provider, BFF or DOM-script sink.

This is the generic React hooks/providers layer. It sits directly above the
framework-agnostic core [`@granit/authentication`](../authentication) (which
owns the provider-neutral OIDC types: `BaseAuthContextType`, `OidcUserInfo`,
`LoginOptions`, `LogoutOptions`) and below the provider-specific hook packages
that wire a real IdP — [`@granit/react-authentication-keycloak`](../react-authentication-keycloak),
[`-cognito`](../react-authentication-cognito), [`-entraid`](../react-authentication-entraid),
[`-google-cloud`](../react-authentication-google-cloud),
[`-local`](../react-authentication-local),
[`-api-keys`](../react-authentication-api-keys) and the dev/test fake
[`@granit/react-authentication-mock`](../react-authentication-mock). Admin
feature kits live in the `react-ui-authentication-*` packages; there is no
generic `react-ui-authentication`.

This package does not call any HTTP endpoint of its own and has no backend
counterpart — it only provides the React plumbing each app uses to expose a
typed `useAuth()` hook. The `/testing` subpath ships an MSW handler for the
generic `GET /api/v1/auth/me` permission probe.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers:

- `@granit/authentication` — supplies `BaseAuthContextType`, the type parameter
  every export is generic over.
- `react` (^19) — context + hooks.
- `msw` (^2, **optional**) — required only when importing the `/testing` subpath
  for MSW-backed tests.

## Quick start

Each app calls `createAuthContext` **once** to mint its own typed context,
extending `BaseAuthContextType` with app-specific fields. A provider-specific
package (or `createMockProvider`) supplies the value at runtime.

```tsx
import { createAuthContext, createMockProvider } from '@granit/react-authentication';
import type { BaseAuthContextType } from '@granit/authentication';

// 1. Define the app's auth shape and mint a typed context once.
interface AppAuthContext extends BaseAuthContextType {
  hasAdminRole: boolean;
}

export const { AuthContext, useAuth } = createAuthContext<AppAuthContext>();

// 2. For dev / Storybook, back it with a fully static fake — no real IdP.
const MockAuthProvider = createMockProvider(AuthContext, {
  authenticated: true,
  loading: false,
  user: { sub: 'u-1', name: 'Ada Lovelace', email: 'ada@example.com' },
  login: () => {},
  logout: () => {},
  hasAdminRole: true,
});

export function App() {
  return (
    <MockAuthProvider>
      <Toolbar />
    </MockAuthProvider>
  );
}

// 3. Consume the typed context anywhere under the provider.
function Toolbar() {
  const { user, hasAdminRole, logout } = useAuth();
  return (
    <header>
      <span>{user?.name}</span>
      {hasAdminRole && <button onClick={() => logout()}>Sign out</button>}
    </header>
  );
}
```

In production, pass the live value from a provider package (for example the hook
from `@granit/react-authentication-keycloak`) into
`AuthContext.Provider value={...}` instead of `createMockProvider`.

For tests, mock the generic permission probe with the `/testing` subpath:

```ts
import { setupServer } from 'msw/node';
import { createAuthHandlers } from '@granit/react-authentication/testing';

const server = setupServer(...createAuthHandlers()); // GET /api/v1/auth/me
```

## Public API

Entry `@granit/react-authentication`:

| Symbol               | Kind | Purpose                                                                           |
| -------------------- | ---- | --------------------------------------------------------------------------------- |
| `createAuthContext`  | fn   | Mint a typed `{ AuthContext, useAuth }` pair; `useAuth` throws outside a provider |
| `createMockProvider` | fn   | Wrap a context with a static value as a provider (dev / Storybook)                |

Entry `@granit/react-authentication/testing`:

| Symbol               | Kind | Purpose                                                           |
| -------------------- | ---- | ----------------------------------------------------------------- |
| `createAuthHandlers` | fn   | MSW handler array for `GET {baseUrl}/me` (default `/api/v1/auth`) |

Both factory functions are generic over `<T extends BaseAuthContextType>`, so
the `useAuth()` return type and the mock value are checked against the app's
extended context shape.

## Caveats

- **Client-side auth state is a UX hint, not a security boundary.** `useAuth()`
  exposes whatever value the provider supplied; an attacker controlling the
  browser can flip `authenticated` or the user claims in memory. Every protected
  endpoint MUST re-authenticate and re-authorize on the .NET backend.
- **`createMockProvider` is for development and tests only.** It satisfies the
  context with a static, fully-trusted fake user and performs no real
  authentication. Never ship it on a production code path. For an MSW-aware mock
  that also resolves BFF endpoints, use
  [`@granit/react-authentication-mock`](../react-authentication-mock) instead.
- **`createAuthHandlers` returns a deliberately broad permission set** covering
  the framework and showcase modules — it is a convenience fixture for the
  admin showcase, not a per-test least-privilege list. Override or replace it
  when a test needs a narrower grant.
- **The second argument of `createAuthHandlers` is deprecated and ignored.** BFF
  session mocks moved to `@granit/react-bff/testing`; compose `createBffHandlers()`
  alongside these handlers instead of passing a sessions URL.

## License

Apache-2.0
