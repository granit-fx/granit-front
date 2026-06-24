# @granit/authorization

Framework-agnostic **authorization** SDK — the TypeScript counterpart of the
.NET `Granit.Authorization` module. It mirrors that module's HTTP contract
(`contracts/openapi/authorization.json`): permission definitions, the current
user's granted permissions, role → permission grants, and the read-only admin
query surfaces for grants and role metadata.

It exposes the DTO types, an Axios HTTP client, the backend permission
constants, and nothing else — **no** React, DOM or Node-only dependency. The
React hooks + query-key layer lives in
[`@granit/react-authorization`](../react-authorization); the admin feature kit
(grids, role/permission editors) lives in
[`@granit/react-ui-authorization`](../react-ui-authorization).

Every function takes the caller's `AxiosInstance` plus a `basePath` (the
module's collection root, e.g. `/api/v1/authorization`), so the same calls work
regardless of where the module is mounted.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the centralized Axios client (CSRF, auth, tenant
  interceptors); supplies the `AxiosInstance` type every call accepts.
- `@granit/query-engine` — `getPage` / `getQueryMeta` and the `PagedResult`,
  `QueryMetadata`, `QueryRequest` types backing the admin query surfaces.
- `@granit/types` — the branded `ISODateString` used by audit fields.

## Quick start

```ts
import {
  getMyPermissions,
  listPermissionDefinitions,
  grantPermission,
  queryPermissionGrants,
  AuthorizationEndpointsPermissions,
} from '@granit/authorization';

const basePath = '/api/v1/authorization';

// 1. Current user's granted permission keys (flat string[]).
const { permissions } = await getMyPermissions(client, basePath);
const canManage = permissions.includes(AuthorizationEndpointsPermissions.Grants.Manage);

// 2. All permission definitions, grouped by module — drives the role editor.
const groups = await listPermissionDefinitions(client, basePath);

// 3. Grant a permission to a role (idempotent PUT).
await grantPermission(client, basePath, {
  roleName: 'admin',
  permissionName: 'Documents.Create',
});

// 4. Paginated, filterable audit view of every grant row (query engine).
const page = await queryPermissionGrants(client, basePath, { page: 1, pageSize: 50 });
```

## Public API

| Symbol                              | Kind  | Purpose                                                             |
| ----------------------------------- | ----- | ------------------------------------------------------------------- |
| `MyPermissionsResponse`             | type  | Current user's granted permission keys (flat string list)           |
| `PermissionDefinitionResponse`      | type  | One permission definition (name, displayName, tenancy sides)        |
| `PermissionGroupResponse`           | type  | A module's group of related permission definitions                  |
| `PermissionGrantResponse`           | type  | Permissions granted to one role (`roleName` + permission keys)      |
| `PermissionGrantParams`             | type  | `{ roleName, permissionName }` for grant / revoke                   |
| `PermissionMultiTenancySide`        | type  | `'Host' \| 'Tenant' \| 'Both'` - where a permission/role is valid   |
| `PermissionGrant`                   | type  | Audited grant row from the `GET {basePath}/grants` query surface    |
| `RoleMetadata`                      | type  | Audited role row from the `GET {basePath}/role-metadata` surface    |
| `getMyPermissions`                  | fn    | `GET {basePath}/permissions`                                        |
| `listPermissionDefinitions`         | fn    | `GET {basePath}/permissions/definitions` (grouped)                  |
| `getRolePermissions`                | fn    | `GET {basePath}/roles/{roleName}`                                   |
| `grantPermission`                   | fn    | `PUT {basePath}/roles/{roleName}/{permissionName}`                  |
| `revokePermission`                  | fn    | `DELETE {basePath}/roles/{roleName}/{permissionName}`               |
| `queryPermissionGrants`             | fn    | `GET {basePath}/grants` -> `PagedResult<PermissionGrant>`           |
| `getPermissionGrantMeta`            | fn    | `GET {basePath}/grants/meta` -> `QueryMetadata`                     |
| `queryRoleMetadata`                 | fn    | `GET {basePath}/role-metadata` -> `PagedResult<RoleMetadata>`       |
| `getRoleMetadataMeta`               | fn    | `GET {basePath}/role-metadata/meta` -> `QueryMetadata`              |
| `AuthorizationEndpointsPermissions` | const | Backend permission keys (`Definitions.Read`, `Grants.Manage`)       |

`queryPermissionGrants` / `queryRoleMetadata` accept an optional `QueryRequest`
(paging, filtering, grouping) and an `AbortSignal`, delegating to
`@granit/query-engine`. The matching `*Meta` calls return the column / filter
metadata that drives a MapGranitQuery grid.

## Out of scope / caveats

- **Not a security boundary.** These calls and constants drive UX gating and
  admin tooling; authorization is enforced by `Granit.Authorization` on the
  .NET backend, which re-checks every request. Hiding a control client-side
  never replaces the server check — see
  [`@granit/react-authorization`](../react-authorization) for the full
  client-side security posture (DevTools tampering, stale-permission /
  cross-tenant confidentiality).
- **Permissions are PII-adjacent** in multi-tenant contexts — do not log or
  surface a user's full permission catalog beyond what the UI needs.
- **Query surfaces are read-only.** `grants` and `role-metadata` expose the
  audited aggregates through the query engine; the marker
  `domainEvents` / `integrationEvents` collections on the .NET aggregates are
  persistence/eventing internals (never on the HTTP contract) and are
  intentionally not mirrored.
- **TS optionality follows the OpenAPI `required` array, not nullability.**
  Audit fields (`modifiedAt`, `modifiedBy`, `tenantId`, …) are present-but-
  nullable (`T | null`), not optional keys.
- **No React, no hooks, no query keys here.** React Query hooks and the
  `buildPermissionQueryKey` factory live in
  [`@granit/react-authorization`](../react-authorization).

## License

Apache-2.0
