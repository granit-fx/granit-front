# @granit/react-authentication-mock

Mock auth provider for **development and tests** — it satisfies the app's auth
context with a configurable fake user and no real IdP, so `useAuth()` resolves
without Keycloak/BFF wiring. Optionally wraps the tree in a `BffProvider` so
`useBffConfig` consumers (session cards, etc.) keep working against MSW-backed
BFF endpoints.

## Usage

```tsx
import { MockAuthProvider } from '@granit/react-authentication-mock';

import { AuthContext } from './auth-context'; // your createAuthContext() instance
import { MOCK_USER } from './mock-user'; // your demo user (app-owned)

<MockAuthProvider context={AuthContext} user={MOCK_USER} bffConfig={{ pathPrefix: '/bff' }}>
  <App />
</MockAuthProvider>;
```

The app keeps owning its context instance and demo user; this package owns the
reusable mechanism. Pattern-agnostic — choosing mock vs bff vs keycloak stays a
host concern.
