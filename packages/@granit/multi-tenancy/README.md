# @granit/multi-tenancy

Framework-agnostic **multi-tenancy** SDK — the TypeScript counterpart of the .NET
`Granit.MultiTenancy` module. It mirrors that contract's wire types, the tenant-admin
HTTP surface, the per-field validation constraints generated from
`contracts/openapi/multi-tenancy.json`, and the **tenant resolver** abstraction that
decides which tenant the current client is acting in.

This is the **core** layer: pure types, Axios-based API calls and synchronous
resolvers, with **no** React, DOM or Node-only dependency. It can drive tenant
resolution and tenant administration from React, React Native, a CLI or tests. The
React hooks/providers layer lives in [`@granit/react-multi-tenancy`](../react-multi-tenancy)
(`TenantProvider`, `useTenant`, the tenant-admin query hooks, Keycloak resolver
wiring); the admin feature kit (list/create/edit pages, form, columns, i18n) lives in
[`@granit/react-ui-multi-tenancy`](../react-ui-multi-tenancy).

Tenant identity flows one way: a resolver extracts a `TenantInfo` from an in-memory
source (a parsed JWT claim, the URL, local storage…), `@granit/api-client` injects the
resolved id as the `X-Tenant-Id` header, and the .NET backend scopes every query to it.
A **Host** user (no `tenant_id` claim) resolves to no tenant and must never have a
tenant header auto-injected — see the caveats below.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published to
a public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth and tenant
  interceptors) passed into every tenant-admin call.
- `@granit/types` — branded id / date types (`TenantId`, `ISODateString`) used by the
  wire DTOs.
- `@granit/validation` — `SchemaConstraints` shape consumed by `multiTenancyConstraints`
  (fed to `createConstraintsResolver` in the React form layer).

## Quick start

Resolve the active tenant from a JWT claim, then drive tenant administration through
the typed API:

```ts
import {
  createJwtClaimTenantResolver,
  resolveTenant,
  createTenant,
  updateTenant,
  activateTenant,
  MultiTenancyPermissions,
} from '@granit/multi-tenancy';
import type { TenantResolver } from '@granit/multi-tenancy';

// 1. Build a resolver pipeline. resolveTenant runs them in ascending `order` and
//    returns the first non-null TenantInfo; the JWT resolver runs at order 200.
const resolvers: TenantResolver[] = [
  createJwtClaimTenantResolver({ tokenParsedGetter: () => keycloak.tokenParsed }),
];
const tenant = resolveTenant(resolvers); // TenantInfo | null — null for a Host user

// 2. Tenant admin. `basePath` is the module root; the calls append `/tenants/...`.
const basePath = '/api/v1/multi-tenancy';

const created = await createTenant(client, basePath, {
  name: 'Acme Corp',
  identifier: 'acme', // ^[a-z0-9-]+$, maxLength 64
});

// 3. Updates echo the optimistic-concurrency stamp from the last read (409 on clash).
await updateTenant(client, basePath, created.id, {
  name: 'Acme International',
  concurrencyStamp: created.concurrencyStamp,
});

await activateTenant(client, basePath, created.id);

// Gate any Host "switch tenant" UI on this permission before setting a tenant header.
const canImpersonate = MultiTenancyPermissions.Host.Impersonate;
```

## Public API

| Symbol                          | Kind  | Purpose                                                         |
| ------------------------------- | ----- | --------------------------------------------------------------- |
| `TenantInfo`                    | type  | Resolved tenant identity (`id`, optional `name`)                |
| `CurrentTenant`                 | type  | Current-context tenant state (`isAvailable`, `tenantId`, name)  |
| `MultiTenancyOptions`           | type  | Config (enabled flag, claim type, header name) — all optional   |
| `TenantResponse`                | type  | Tenant-admin read DTO (incl. `concurrencyStamp`, `createdAt`)   |
| `CreateTenantRequest`           | type  | `POST .../tenants` body (`name`, `identifier`, …)               |
| `UpdateTenantRequest`           | type  | `PUT .../tenants/{id}` body (carries `concurrencyStamp`)        |
| `TenantResolver`                | type  | Sync resolver interface (`order`, `name`, `resolve()`)          |
| `JwtClaimTenantResolverOptions` | type  | Options for the JWT-claim resolver (`tokenParsedGetter`, claim) |
| `DEFAULT_MULTI_TENANCY_OPTIONS` | const | Defaults: enabled, `tenant_id` claim, `X-Tenant-Id` header      |
| `MultiTenancyPermissions`       | const | Permission string registry (`Tenants.*`, `Host.Impersonate`)    |
| `multiTenancyConstraints`       | const | Generated per-field validation constraints (from OpenAPI spec)  |
| `resolveTenant`                 | fn    | Run a resolver pipeline; first non-null `TenantInfo` wins       |
| `createJwtClaimTenantResolver`  | fn    | Resolver reading the tenant id from a JWT claim (order 200)     |
| `getTenant`                     | fn    | `GET {basePath}/tenants/{id}` → `TenantResponse`                |
| `createTenant`                  | fn    | `POST {basePath}/tenants` → `TenantResponse`                    |
| `updateTenant`                  | fn    | `PUT {basePath}/tenants/{id}` (concurrency-checked)             |
| `activateTenant`                | fn    | `POST {basePath}/tenants/{id}/activate`                         |
| `deactivateTenant`              | fn    | `POST {basePath}/tenants/{id}/deactivate`                       |

## Out of scope / caveats

- **No tenant list endpoint.** The backend deliberately does **not** expose a plain
  `GET /tenants` list. Tenant listing is served by a `Granit.QueryEngine` endpoint
  (`PagedResult`) registered by the consumer at `{basePath}/tenants` and consumed
  generically via [`@granit/react-query-engine`](../react-query-engine) — hence there is
  no `listTenants` here and no `useTenants` in the React layer.
- **Host never auto-injects a tenant header.** A Host user carries no `tenant_id` claim,
  so `createJwtClaimTenantResolver` resolves to `undefined` by construction. Acting in a
  tenant's context (sending `X-Tenant-Id`) requires the
  `MultiTenancyPermissions.Host.Impersonate` permission; any explicit Host "switch
  tenant" UI must gate on it before setting a tenant. See security audit VULN-203.
- **Client resolution is a routing hint, not a security boundary.** The resolved tenant
  selects which scope the client *requests*; the .NET backend is the authority that
  scopes every query and rejects cross-tenant access. A stale tenant after a switch is a
  confidentiality concern — clear the React Query cache via
  `useClearQueriesOnTenantChange` from [`@granit/react-multi-tenancy`](../react-multi-tenancy).
- **Optimistic concurrency, never `If-Match`.** `updateTenant` carries the
  `concurrencyStamp` in the body; a stale stamp yields a `409`. Read the tenant, edit,
  then echo the stamp from that read — do not cache a stale value across edits.
- **Constraints are generated — do not edit.** `multiTenancyConstraints` is emitted by
  `scripts/generate-front-constraints.mjs` from `contracts/openapi/multi-tenancy.json`
  and regenerated on pre-commit. The OpenAPI spec is the single source of truth for
  field lengths, the `identifier` pattern and `required`-ness.

## License

Apache-2.0
