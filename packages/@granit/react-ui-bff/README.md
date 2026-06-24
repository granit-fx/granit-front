# @granit/react-ui-bff

The **BFF auth provider** for Granit apps — the UI companion to the headless
[`@granit/react-bff`](../react-bff), mirroring the backend's top-level **Bff**
module (contract: `contracts/openapi/bff.json`). It wraps `react-bff`'s
`BffProvider`, adapts the BFF session to the app's auth context, wires the
401→login bridge and the CSRF manager, and renders the init spinner /
backend-unavailable retry screen.

This is the **react-ui feature kit** layer: it owns rendering (Spinner, retry
screen) and the glue between the BFF session and the app's auth context. The
transport types + `CsrfManager` live in [`@granit/bff`](../bff) (mirror of
`Granit.Bff`); the headless provider/hooks live in
[`@granit/react-bff`](../react-bff); the auth-context shape it fills is
[`KeycloakAuthContextType`](../authentication-keycloak). It is a sibling to the
authentication-provider feature kits
([`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak),
[`@granit/react-authentication-mock`](../react-authentication-mock)): an app
mounts exactly one of these as its top-level auth provider, depending on whether
the session is brokered by the BFF, by Keycloak directly, or mocked.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-bff` — the headless `BffProvider` / `useBffConfig` this kit wraps.
- `@granit/bff` — `BffConfig`, `BffUser`, `CsrfManager` transport types.
- `@granit/authentication-keycloak` — `KeycloakAuthContextType` / `KeycloakUserInfo`,
  the auth-context shape this provider fills.
- `@granit/api-client` — supplies `setOnUnauthorized` for the 401→login bridge.
- `@granit/react-ui` — `Button` / `Spinner` for the init and retry screens.
- `@granit/react-localization` — `useTranslation` for the screen copy.
- `@granit/logger` — `createLogger` for runtime diagnostics.
- `lucide-react` (`^1.21`) — the `AlertTriangle` icon on the unavailable screen.
- `react` (`^19`).

## Quick start

Mount `BffAuthProvider` once at the app root, above everything that reads the
auth context. The host owns its context instance, the BFF path prefix, the public
layout used for the unavailable screen, and the API-client CSRF wiring; the
package owns the BFF↔auth-context bridge.

```tsx
import { BffAuthProvider } from '@granit/react-ui-bff';

import { AuthContext } from './auth-context'; // your createAuthContext() instance
import { PublicLayout } from './public-layout'; // wraps the backend-unavailable screen
import { setCsrfManager } from './api'; // wires the CsrfManager into your axios client

function Root() {
  return (
    <BffAuthProvider
      context={AuthContext}
      config={{ pathPrefix: '/bff' }}
      layout={PublicLayout}
      onCsrfManager={setCsrfManager}
    >
      <App />
    </BffAuthProvider>
  );
}
```

While the BFF session resolves, the provider renders a full-screen spinner. Once
resolved it publishes a `KeycloakAuthContextType` value (`authenticated`, `user`,
`login`, `logout`) on the supplied context, so the rest of the app reads auth
through the same `useAuth()`-style hook regardless of the provider in use. A 401
from the Axios client routes through `setOnUnauthorized` to a one-shot
redirect-to-login bridge; `login` first probes `{pathPrefix}/bff/user` for
reachability and, if the BFF is down (502/503/unreachable), shows the retry
screen instead of looping on a dead redirect.

## Public API

| Symbol                 | Kind     | Purpose                                                          |
| ---------------------- | -------- | ---------------------------------------------------------------- |
| `BffAuthProvider`      | provider | Wraps `BffProvider`, fills the app auth context, renders states  |
| `BffAuthProviderProps` | type     | `{ context, config, layout?, onCsrfManager?, children }`         |

`BffAuthProviderProps`:

- `context` — the app's `Context<KeycloakAuthContextType | undefined>` (from
  `createAuthContext`); the provider publishes its adapted session here.
- `config` — `BffConfig` (`pathPrefix` + optional logger), forwarded to
  `BffProvider` and used for the reachability probe.
- `layout` — optional wrapper component for the backend-unavailable screen;
  defaults to a passthrough.
- `onCsrfManager` — optional setter invoked with the BFF `CsrfManager` so the host
  can register it in its Axios CSRF interceptor.

## Caveats

- **Single top-level auth provider.** Mount exactly one of this kit and its
  authentication-provider siblings; they each fill the same auth context and
  install a `setOnUnauthorized` handler, so stacking them is undefined.
- **Module-level 401 wiring.** The 401→login bridge and the `CsrfManager`
  registration are guarded at module scope so React StrictMode's
  mount→unmount→remount in dev does not trip `setOnUnauthorized`'s
  re-registration warning. The handler always invokes the *latest* `login` and
  skips the redirect while the user is unauthenticated (e.g. on `/login`) to
  avoid a 401 loop.
- **Intentional native `fetch`.** The reachability probe hits
  `{pathPrefix}/bff/user` with `fetch` (not the Axios client) on purpose: an
  interceptor-free liveness check, since routing it through the client would trip
  the 401→login redirect and loop. This is infra below the Axios client and the
  documented exception to the centralized-HTTP rule.
- **Name claim splitting.** `BffUser.name` is split on the first space into
  `given_name` / `family_name` for `KeycloakUserInfo`; multi-word given names or
  cultures that do not follow "given family" ordering may map imperfectly.

## Out of scope

- **Transport + CSRF mechanics** — `BffConfig`, `BffUser`, `CsrfManager` and the
  session fetch are owned by [`@granit/bff`](../bff) and
  [`@granit/react-bff`](../react-bff); this kit only adapts and renders them.
- **The auth context itself** — the host creates and owns its
  `KeycloakAuthContextType` context via `createAuthContext`; this package fills it
  but never defines it.
- **Permission / role gating** — authorization is
  [`@granit/react-authorization`](../react-authorization); this package only
  establishes *who* the user is.

## License

Apache-2.0
