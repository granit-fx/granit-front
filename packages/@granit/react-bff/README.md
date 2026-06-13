# @granit/react-bff

React bindings for `@granit/bff` -- BFF authentication, CSRF management, route guard.

> **Sessions moved.** The caller's own session listing/revocation is no longer a
> BFF concern (granit-dotnet #2692). Use `@granit/react-identity`
> (`useMyUserSessions`, `useRevokeMyUserSession`, `useRevokeMyOtherUserSessions`,
> `useMyUserDevices`) against the canonical `/sessions` (+ `/devices`) endpoints.

## Installation

```bash
pnpm add @granit/react-bff
```

## API

### Components

- `BffProvider` -- provides BFF authentication context to the component tree
- `BffGuard` -- route guard that redirects unauthenticated users

### Hooks

- `useBffContext()` -- access BFF context
- `useBffAuth()` -- authentication state and actions
- `useBffCsrf()` -- CSRF token management
- `useBffFetch()` -- fetch wrapper with CSRF and credentials

## Usage

```tsx
import { BffProvider, BffGuard, useBffAuth } from '@granit/react-bff';

function App() {
  return (
    <BffProvider loginUrl="/bff/login" userUrl="/bff/user">
      <BffGuard fallback={<LoginPage />}>
        <Dashboard />
      </BffGuard>
    </BffProvider>
  );
}

function Dashboard() {
  const { user, logout } = useBffAuth();
  return <div>Welcome, {user?.name}</div>;
}
```

## License

Apache-2.0
