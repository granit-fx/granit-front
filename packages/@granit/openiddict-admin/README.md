# @granit/openiddict-admin

Admin-module API: QueryEngine user listing, user impersonation, and OpenIddict
management (OIDC applications, scopes, authorizations). Mirrors the
`/api/v1/admin/*` surface of `Granit.OpenIddict.Endpoints`.

> User / role / group CRUD lives in `@granit/identity` (`/identity/provider/*`).
> This package keeps only the endpoints owned by the admin module itself.

## Installation

```bash
pnpm add @granit/openiddict-admin
```

## API

### Types

- `AdminUser`, `AdminUserListParams`, `AdminUserPage` -- admin user listing
- `AdminImpersonationResult` -- user impersonation
- `AdminOidcApplication`, `AdminOidcApplicationCreateRequest`, `AdminOidcApplicationSecretResponse` -- OIDC apps
- `AdminOidcScope`, `AdminOidcScopeCreateRequest` -- OIDC scopes
- `AdminOidcAuthorization`, `AdminOidcAuthorizationListParams` -- OIDC authorizations

### Functions

- `listUsers(...)`, `impersonateUser(...)` -- admin user listing + impersonation
- `listApplications(...)`, `createApplication(...)`, `deleteApplication(...)`, `rotateApplicationSecret(...)` -- OIDC apps
- `listScopes(...)`, `createScope(...)`, `deleteScope(...)` -- OIDC scopes
- `listAuthorizations(...)`, `revokeAuthorization(...)`, `revokeUserAuthorizations(...)` -- OIDC authorizations

## Usage

```ts
import { listUsers, impersonateUser } from '@granit/openiddict-admin';

const page = await listUsers(client, basePath, { page: 1, pageSize: 20 });
const tokens = await impersonateUser(client, basePath, userId);
```

## License

Apache-2.0
