# @granit/react-ui-authentication-entraid

The **EntraId auth provider** for Granit apps — wires
[`@granit/react-authentication-entraid`](../react-authentication-entraid)'s `useEntraIdInit` into the app's auth
context, forwards the active UI locale to the IdP login, and shows an init spinner until the session
resolves. Companion to [`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak).

## Usage

```tsx
import { EntraIdAuthProvider } from '@granit/react-ui-authentication-entraid';

import { AuthContext } from './auth-context'; // your createAuthContext() instance

<EntraIdAuthProvider context={AuthContext} config={/* EntraIdCoreConfig */}>
  <App />
</EntraIdAuthProvider>;
```

The app owns its context instance and decides — via its auth-mode — whether to mount this provider.
