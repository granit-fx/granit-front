# @granit/react-ui-authentication-keycloak

The **Keycloak auth provider** for Granit apps. Wires
[`@granit/react-authentication-keycloak`](../react-authentication-keycloak)'s
`useKeycloakInit` into the app's auth context, forwards the active UI locale to
the IdP login, and shows an init spinner until the session resolves.

The Keycloak parallel to [`@granit/react-ui-authentication-local`](../react-ui-authentication-local):
the local package carries the OpenIddict **login pages**; Keycloak hosts its own
login UI, so this package ships only the **provider**.

## Usage

```tsx
import { KeycloakAuthProvider } from '@granit/react-ui-authentication-keycloak';

import { AuthContext } from './auth-context'; // your createAuthContext() instance

<KeycloakAuthProvider
  context={AuthContext}
  config={{ url: KEYCLOAK_URL, realm: KEYCLOAK_REALM, clientId: KEYCLOAK_CLIENT_ID }}
>
  <App />
</KeycloakAuthProvider>;
```

The app owns its context instance and decides — via its auth-mode — whether to
mount this provider; the package owns the reusable wiring.
