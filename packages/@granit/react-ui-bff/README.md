# @granit/react-ui-bff

The **BFF auth provider** for Granit apps — the UI companion to the headless
[`@granit/react-bff`](../react-bff), mirroring the backend's top-level **Bff**
module. Wraps `BffProvider`, adapts the BFF session to the app's auth context,
wires the 401→login bridge and the CSRF manager, and renders the init spinner /
backend-unavailable retry screen.

Companion to [`@granit/react-ui-authentication-keycloak`](../react-ui-authentication-keycloak)
and [`@granit/react-authentication-mock`](../react-authentication-mock).

## Usage

```tsx
import { BffAuthProvider } from '@granit/react-ui-bff';

import { AuthContext } from './auth-context'; // your createAuthContext() instance
import { PublicLayout } from './public-layout';
import { setCsrfManager } from './api'; // your axios CSRF wiring

<BffAuthProvider
  context={AuthContext}
  config={{ pathPrefix: BFF_PREFIX }}
  layout={PublicLayout}
  onCsrfManager={setCsrfManager}
>
  <App />
</BffAuthProvider>;
```

The host owns its context instance, BFF path prefix, public layout and the
API-client CSRF wiring; the package owns the BFF↔auth-context bridge. The 401
handler uses `setOnUnauthorized` from `@granit/api-client`.
