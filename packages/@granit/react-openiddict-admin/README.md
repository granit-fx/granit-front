# @granit/react-openiddict-admin

React hooks for `@granit/openiddict-admin` -- users, roles, groups, OIDC applications, scopes, authorizations.

## Installation

```bash
pnpm add @granit/react-openiddict-admin
```

## API

### Components

- `OpenIddictAdminProvider` -- provides admin configuration to the component tree

### Hooks

- `useAdminConfig()` -- access admin configuration from context
- `useAdminUsers()`, `useAdminUser(id)`, `useCreateAdminUser()`, `useDeleteAdminUser()`, `useImpersonateUser()` -- user management
- `useAdminRoles()`, `useAdminRoleMembers(roleId)`, `useCreateAdminRole()`, `useDeleteAdminRole()` -- role management
- `useAdminGroups()`, `useCreateAdminGroup()`, `useDeleteAdminGroup()`, `useAddGroupMember()`, `useRemoveGroupMember()` -- group management
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
