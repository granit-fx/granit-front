# @granit/react-openiddict-admin

React hooks for `@granit/openiddict-admin` -- admin user listing & impersonation, OIDC applications, scopes, authorizations.

> User/role/group CRUD lives in `@granit/react-identity` (backed by `/identity/provider/*`).
> This package exposes only the QueryEngine-backed admin user listing and the impersonation
> endpoint, which are owned by the admin module.

## Installation

```bash
pnpm add @granit/react-openiddict-admin
```

## API

### Components

- `OpenIddictAdminProvider` -- provides admin configuration to the component tree

### Hooks

- `useAdminConfig()` -- access admin configuration from context
- `useAdminUsers()`, `useImpersonateUser()` -- QueryEngine admin user listing and impersonation
- `useOidcApplications()`, `useCreateOidcApplication()`, `useDeleteOidcApplication()`, `useRotateApplicationSecret()` -- OIDC apps
- `useOidcScopes()`, `useCreateOidcScope()`, `useDeleteOidcScope()` -- OIDC scopes
- `useOidcAuthorizations()`, `useRevokeAuthorization()`, `useRevokeUserAuthorizations()` -- OIDC authorizations

## Usage

```tsx
import { OpenIddictAdminProvider, useAdminUsers } from '@granit/react-openiddict-admin';

function App() {
  return (
    <OpenIddictAdminProvider client={axiosInstance} basePath="/api/admin">
      <UserList />
    </OpenIddictAdminProvider>
  );
}

function UserList() {
  const { data: users } = useAdminUsers();
  return (
    <ul>
      {users?.items.map((u) => (
        <li key={u.id}>{u.email}</li>
      ))}
    </ul>
  );
}
```

## License

Apache-2.0
