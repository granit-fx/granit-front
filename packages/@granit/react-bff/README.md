# @granit/react-bff

React bindings for `@granit/bff` -- BFF authentication, CSRF management, session management, route guard.

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
- `useBffSessions()` -- list active sessions
- `useRevokeBffSession()` -- revoke a specific session
- `useRevokeAllOtherBffSessions()` -- revoke all other sessions

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
