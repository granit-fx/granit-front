# @granit/react-multi-tenancy

React bindings for the Granit **multi-tenancy** module — runtime tenant resolution
(`TenantProvider` / `useTenant`), tenant-switch cache hygiene, and the tenant-admin
TanStack Query hooks. This is the **React hooks + providers layer**: it wraps the
framework-agnostic resolvers, Axios calls and DTOs from
[`@granit/multi-tenancy`](../multi-tenancy) in React context and query hooks. It holds
no rendering — list grids, forms and pages live one layer up.

The split is three packages over the same .NET `Granit.MultiTenancy` backend (contract:
`contracts/openapi/multi-tenancy.json`):

- [`@granit/multi-tenancy`](../multi-tenancy) — framework-agnostic core: wire DTOs,
  Axios functions (`createTenant`, `updateTenant`, …), tenant resolvers
  (`createJwtClaimTenantResolver`, `resolveTenant`), permission registry and generated
  validation constraints.
- `@granit/react-multi-tenancy` (this package) — `TenantProvider`, `useTenant`, the
  Keycloak resolver hook, cache-clearing safety hooks, and the tenant-admin query hooks.
- [`@granit/react-ui-multi-tenancy`](../react-ui-multi-tenancy) — admin UI kit: the
  query-driven tenant list (filters, sortable columns, export, per-row activate /
  deactivate), the create form, and the edit view.

Tenant identity flows one way: a resolver extracts the tenant id from an in-memory source
(a parsed JWT claim, the URL, local storage…), `TenantProvider` registers it with
`@granit/api-client` so the resolved id is injected as the `X-Tenant-Id` header, and the
.NET backend scopes every query to it. A **Host** user (no `tenant_id` claim) resolves to
no tenant and never has a tenant header auto-injected — see the caveats below.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published to a
public registry for app consumption. A consumer must declare these peers:

- `@granit/multi-tenancy` — core resolvers, DTOs and Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors)
  and `setTenantGetter`, into which `TenantProvider` registers the resolved tenant id.
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for the
  Axios client when `TenantAdminConfig.client` is omitted.
- `@granit/types` — shared base types (branded ids, `ISODateString`).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `@granit/query-engine` / `@granit/react-query-engine` (**optional**) — only for the
  `/testing` tenant grid metadata + handlers; the tenant *list* is a QueryEngine surface.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-multi-tenancy/testing`
  subpath.

## Quick start

Build a resolver pipeline (here from a Keycloak token), wire `TenantProvider`, and pass it
the `QueryClient` so the tenant-A cache is dropped before tenant-B renders. Then read the
tenant anywhere below it.

```tsx
import { TenantProvider, useKeycloakTenantResolvers, useTenant } from '@granit/react-multi-tenancy';
import { useQueryClient } from '@tanstack/react-query';

function TenantRoot({ tokenParsed, children }: { tokenParsed: Record<string, unknown>; children: React.ReactNode }) {
  const resolvers = useKeycloakTenantResolvers({ tokenParsed }); // reads `tenant_id` claim
  const queryClient = useQueryClient();

  // `queryClient` is the fail-safe: cache is cleared on every tenant-id change,
  // so an un-partitioned query key cannot leak a response across tenants.
  return (
    <TenantProvider resolvers={resolvers} queryClient={queryClient}>
      {children}
    </TenantProvider>
  );
}

function TenantBadge() {
  const { isAvailable, tenantName } = useTenant(); // throws outside a TenantProvider
  return <span>{isAvailable ? tenantName : 'Host (no tenant)'}</span>;
}
```

Tenant-admin screens mount a `TenantAdminProvider` (resolves the Axios client, base path
and query-key prefix), then drive create / read / update / activate through the mutation
hooks. The tenant **list** is not a hook here — it is a `Granit.QueryEngine` `PagedResult`
surface consumed via [`@granit/react-query-engine`](../react-query-engine).

```tsx
import {
  TenantAdminProvider,
  useCreateTenant,
  useTenantDetail,
  useActivateTenant,
} from '@granit/react-multi-tenancy';
import { useGranitClient } from '@granit/react-api-client';

function AdminRoot({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <TenantAdminProvider config={{ client: useGranitClient() }}>
      {children}
    </TenantAdminProvider>
  );
}

function TenantEditor({ id }: { id: string }) {
  const { data: tenant } = useTenantDetail(id); // disabled while id is empty
  const create = useCreateTenant();             // invalidates the tenant list on success
  const activate = useActivateTenant();

  // create.mutate({ name, identifier }); activate.mutate(tenant.id);
  return <pre>{tenant?.name}</pre>;
}
```

## Public API

| Symbol                          | Kind     | Purpose                                                                |
| ------------------------------- | -------- | ---------------------------------------------------------------------- |
| `TenantProvider`                | provider | Resolves the tenant, registers `setTenantGetter`, fail-safe cache clear |
| `useTenant`                     | hook     | Current `CurrentTenant` from context; throws outside a provider        |
| `TenantProviderProps`           | type     | `{ resolvers, options?, queryClient?, onTenantChange?, children }`     |
| `useKeycloakTenantResolvers`    | hook     | Memoized resolver list reading the tenant id from a Keycloak JWT claim |
| `UseKeycloakTenantResolversOptions` | type | `{ tokenParsed, claimType? }` (claim defaults to `tenant_id`)          |
| `useClearQueriesOnTenantChange` | hook     | Clears the React Query cache when the active tenant id changes         |
| `useClearQueriesOnUserChange`   | hook     | Clears the cache when the authenticated user id changes (same tenant)  |
| `TenantAdminProvider`           | provider | Supplies client / base path / query-key prefix to the admin hooks      |
| `useTenantAdminConfig`          | hook     | Read the resolved admin config; throws outside the provider            |
| `buildTenantAdminQueryKey`      | fn       | Query-key factory honoring the configured `queryKeyPrefix`             |
| `TenantAdminConfig`             | type     | Provider input (optional `client` / `basePath` / `queryKeyPrefix`)     |
| `TenantAdminProviderProps`      | type     | `{ config, children }`                                                 |
| `useTenantDetail`               | hook     | `GET {basePath}/tenants/{id}` → `TenantResponse`                       |
| `useCreateTenant`               | hook     | `POST {basePath}/tenants`; invalidates the tenant list                 |
| `useUpdateTenant`               | hook     | `PUT {basePath}/tenants/{id}` (concurrency-checked); invalidates list  |
| `useActivateTenant`             | hook     | `POST {basePath}/tenants/{id}/activate`; invalidates list              |
| `useDeactivateTenant`           | hook     | `POST {basePath}/tenants/{id}/deactivate`; invalidates list            |

`./testing` subpath (requires the optional `msw` + QueryEngine peers):
`createTenantHandlers` (stateful MSW handlers, default base `/api/v1/multi-tenancy`,
including the QueryEngine `/tenants` grid + `/meta`), the `tenantQueryMetadata` fixture,
and the `mockTenants` data array.

## Out of scope / caveats

- **No `useTenants` list hook.** The backend deliberately does not expose a plain
  `GET /tenants` list; the tenant list is a `Granit.QueryEngine` `PagedResult` endpoint
  registered at `{basePath}/tenants` and consumed generically via
  [`@granit/react-query-engine`](../react-query-engine). This package owns only the
  single-tenant read and the create / update / activate / deactivate mutations.
- **Cross-tenant cache leakage is a confidentiality issue, not just a UX bug.** Query
  keys are not tenant-partitioned, so after an in-place tenant switch a tenant-A response
  can be served briefly under tenant-B. Prefer passing `queryClient` to `TenantProvider`
  (applied automatically, cannot be forgotten); `useClearQueriesOnTenantChange` is the
  manual equivalent. `useClearQueriesOnUserChange` covers the complementary case of a
  user switch inside the same tenant (logout A → login B). See security audit VULN-200.
- **Host never auto-injects a tenant header.** A Host user carries no `tenant_id` claim,
  so the Keycloak resolver resolves to no tenant and `useTenant()` reports
  `isAvailable: false`. Acting in a tenant's context requires the
  `MultiTenancyPermissions.Host.Impersonate` permission (from
  [`@granit/multi-tenancy`](../multi-tenancy)); any explicit Host "switch tenant" UI must
  gate on it before setting a tenant. See security audit VULN-203.
- **Client resolution is a routing hint, not a security boundary.** The resolved tenant
  selects which scope the client *requests*; the .NET backend is the authority that scopes
  every query and rejects cross-tenant access.
- **Optimistic concurrency, never `If-Match`.** `useUpdateTenant` forwards the
  `concurrencyStamp` carried in `UpdateTenantRequest`; a stale stamp yields a `409`. Read
  the tenant, edit, then echo the stamp from that read — do not cache a stale value.
- **Rendering lives one layer up.** Tenant list grids, forms and pages are in
  [`@granit/react-ui-multi-tenancy`](../react-ui-multi-tenancy); DTOs and HTTP transport
  are owned by [`@granit/multi-tenancy`](../multi-tenancy). This package is headless.

## License

Apache-2.0
