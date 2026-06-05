# @granit/authorization

Permission and role authorization types -- TypeScript mirror of Granit.Authorization .NET.

## Installation

```bash
pnpm add @granit/authorization
```

## API

### Types

- `MyPermissionsResponse` -- current user's granted permissions (`GET /permissions`)
- `PermissionDefinitionResponse` -- single permission definition
- `PermissionGroupResponse` -- group of related permission definitions
- `PermissionGrantResponse` -- permissions granted to a specific role
- `PermissionGrantParams` -- parameters for granting/revoking a permission
- `PermissionMultiTenancySide` -- tenancy scope of a permission (`Host` / `Tenant` / `Both`)
- `PermissionGrant` -- permission-grant row from the `GET /grants` query surface
- `RoleMetadata` -- role-metadata row from the `GET /role-metadata` query surface

### Functions

- `getMyPermissions`, `listPermissionDefinitions`, `getRolePermissions`
- `grantPermission`, `revokePermission`
- `queryPermissionGrants`, `getPermissionGrantMeta`
- `queryRoleMetadata`, `getRoleMetadataMeta`

## Usage

```ts
import type { MyPermissionsResponse, PermissionDefinitionResponse } from '@granit/authorization';
```

## License

Apache-2.0
