# @granit/openiddict-admin

OpenIddict admin management -- users, roles, groups, OIDC applications, scopes, and authorizations. Mirrors `Granit.OpenIddict.Endpoints` .NET admin contract.

## Installation

```bash
pnpm add @granit/openiddict-admin
```

## API

### Types

- `AdminUser`, `AdminUserCreateRequest`, `AdminUserListParams`, `AdminUserPage` -- user management
- `AdminRole`, `AdminRoleCreateRequest`, `AdminRoleMember` -- role management
- `AdminGroup`, `AdminGroupCreateRequest`, `AdminGroupMemberRequest` -- group management
- `AdminOidcApplication`, `AdminOidcApplicationCreateRequest`, `AdminOidcApplicationSecretResponse` -- OIDC apps
- `AdminOidcScope`, `AdminOidcScopeCreateRequest` -- OIDC scopes
- `AdminOidcAuthorization`, `AdminOidcAuthorizationListParams` -- OIDC authorizations
- `AdminImpersonationResult` -- user impersonation

### Functions

- `listUsers(...)`, `getUser(...)`, `createUser(...)`, `deleteUser(...)`, `impersonateUser(...)` -- users
- `listRoles(...)`, `createRole(...)`, `deleteRole(...)`, `getRoleMembers(...)` -- roles
- `listGroups(...)`, `createGroup(...)`, `deleteGroup(...)`, `addGroupMember(...)`, `removeGroupMember(...)` -- groups
- `listApplications(...)`, `createApplication(...)`, `deleteApplication(...)`, `rotateApplicationSecret(...)` -- OIDC apps
- `listScopes(...)`, `createScope(...)`, `deleteScope(...)` -- OIDC scopes
- `listAuthorizations(...)`, `revokeAuthorization(...)`, `revokeUserAuthorizations(...)` -- OIDC authorizations

## Usage

```ts
import { listUsers, createRole } from '@granit/openiddict-admin';

const users = await listUsers(client, basePath, { page: 1, pageSize: 20 });
await createRole(client, basePath, { name: 'editor' });
```

## License

Apache-2.0
