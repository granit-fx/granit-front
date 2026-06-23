# @granit/react-ui-authentication-cognito

The **Cognito auth provider** for Granit apps — wires
[`@granit/react-authentication-cognito`](../react-authentication-cognito)'s `useCognitoInit` into the app's auth
context, forwards the active UI locale to the IdP login, and shows an init spinner until the session
resolves. Companion to [`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak).

## Usage

```tsx
import { CognitoAuthProvider } from '@granit/react-ui-authentication-cognito';

import { AuthContext } from './auth-context'; // your createAuthContext() instance

<CognitoAuthProvider context={AuthContext} config={/* CognitoCoreConfig */}>
  <App />
</CognitoAuthProvider>;
```

The app owns its context instance and decides — via its auth-mode — whether to mount this provider.
