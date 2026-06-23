# @granit/react-ui-authentication-google-cloud

The **GoogleCloud auth provider** for Granit apps — wires
[`@granit/react-authentication-google-cloud`](../react-authentication-google-cloud)'s `useGoogleCloudInit` into the app's auth
context, forwards the active UI locale to the IdP login, and shows an init spinner until the session
resolves. Companion to [`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak).

## Usage

```tsx
import { GoogleCloudAuthProvider } from '@granit/react-ui-authentication-google-cloud';

import { AuthContext } from './auth-context'; // your createAuthContext() instance

<GoogleCloudAuthProvider context={AuthContext} config={/* GoogleCloudCoreConfig */}>
  <App />
</GoogleCloudAuthProvider>;
```

The app owns its context instance and decides — via its auth-mode — whether to mount this provider.
