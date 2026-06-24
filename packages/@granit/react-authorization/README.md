# @granit/react-authorization

React hooks + provider for the Granit **authorization** module — permission
checking, permission/role definitions, and admin role-grant management. This is
the **React hooks layer**: it wraps the framework-agnostic Axios calls and DTOs
from [`@granit/authorization`](../authorization) in TanStack Query hooks with a
shared `AuthorizationProvider` for client/base-path/query-key configuration. It
holds no rendering — buttons, tables, and panels live one layer up.

The split is three packages over the same .NET `Granit.Authorization` backend
(contract: `contracts/openapi/authorization.json`):

- [`@granit/authorization`](../authorization) — framework-agnostic core: DTOs +
  Axios functions (`getMyPermissions`, `queryPermissionGrants`, …).
- `@granit/react-authorization` (this package) — React Query hooks + provider.
- [`@granit/react-ui-authorization`](../react-ui-authorization) — admin UI kit:
  role/permission management panel, grant/role-metadata discovery tables, and the
  permission-side badge.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/authorization` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/query-engine` — `PagedResult` / `QueryRequest` / `QueryMetadata` for the
  grant and role-metadata discovery surfaces.
- `@granit/types` — shared base types.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `axios` (`^1.6`) — peer of the underlying client.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-authorization/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { AuthorizationProvider, usePermissions } from '@granit/react-authorization';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <AuthorizationProvider config={{ client: useGranitClient() }}>
      {children}
    </AuthorizationProvider>
  );
}

function DeleteButton() {
  const { hasPermission, isLoading } = usePermissions();

  // Skip the fetch / hide the control the user cannot use (see Security model).
  if (isLoading || !hasPermission('Invoices.Delete')) return null;
  return <button type="button">Delete</button>;
}
```

`usePermissions()` returns a `ReadonlySet<string>` of granted permission names with
O(1) lookups (`hasPermission`, `hasAnyPermission`, `hasAllPermissions`), cached for
the session (`staleTime: Infinity`); call `refetch()` after an admin grant. Admin
screens combine the query hooks with `usePermissionGrant` mutations:

```tsx
import {
  usePermissionDefinitions,
  usePermissionGrant,
  useRolePermissions,
} from '@granit/react-authorization';

function RoleMatrix({ roleName }: { roleName: string }) {
  const { data: groups } = usePermissionDefinitions();
  const { data: grant } = useRolePermissions({ roleName });
  const { grant: grantMut, revoke } = usePermissionGrant();

  const granted = new Set(grant?.permissions ?? []);
  return groups?.flatMap((g) =>
    g.permissions.map((p) => (
      <Toggle
        key={p.name}
        checked={granted.has(p.name)}
        onChange={(on) =>
          (on ? grantMut : revoke).mutate({ roleName, permissionName: p.name })
        }
      />
    ))
  );
}
```

## Public API

| Symbol                           | Kind     | Purpose                                                               |
| -------------------------------- | -------- | --------------------------------------------------------------------- |
| `AuthorizationProvider`          | provider | Supplies client, base path, query-key prefix to all hooks below it    |
| `useAuthorizationConfig`         | hook     | Read the resolved config; throws outside a provider                   |
| `useOptionalAuthorizationConfig` | hook     | Read the resolved config or `null` if no provider                     |
| `usePermissions`                 | hook     | Current user's grants as a `Set` + `hasPermission`/`hasAny`/`hasAll`  |
| `usePermissionDefinitions`       | hook     | `GET .../permissions/definitions` — full permission tree by module    |
| `useRolePermissions`             | hook     | `GET .../roles/{roleName}` — permission names granted to a role       |
| `usePermissionGrant`             | hook     | `grant`/`revoke` mutations (`PUT`/`DELETE .../roles/{r}/{p}`)         |
| `usePermissionGrants`            | hook     | `GET .../grants` — paginated/filterable grant discovery surface       |
| `usePermissionGrantMeta`         | hook     | `GET .../grants/meta` — query metadata for the grant surface          |
| `useRoleMetadata`                | hook     | `GET .../role-metadata` — paginated/filterable role discovery surface |
| `useRoleMetadataMeta`            | hook     | `GET .../role-metadata/meta` — query metadata for the role surface    |
| `buildPermissionQueryKey`        | fn       | Query-key factory honoring the configured `queryKeyPrefix`            |
| `AuthorizationConfig`            | type     | Provider input (optional client / basePath / queryKeyPrefix)          |
| `ResolvedAuthorizationConfig`    | type     | Provider output with the resolved required client + basePath          |
| `AuthorizationProviderProps`     | type     | `{ config, children }`                                                |
| `UsePermissionsReturn`           | type     | Shape returned by `usePermissions`                                    |
| `UsePermissionGrantReturn`       | type     | `{ grant, revoke }` mutation results                                  |
| `Use*Options`                    | type     | Per-hook options (client, basePath, enabled, queryKeyPrefix)          |

`./testing` subpath (requires the optional `msw` peer): `createAuthorizationHandlers`
(stateful MSW handlers, default base `/api/v1/authorization`) plus the
`mockPermissionGroups`, `mockRoleGrants`, `mockPermissionGrants`, and
`mockRoleMetadata` fixtures.

## Security model

> **Client-side permission checks are a UX hint, not a security boundary.**
> Every endpoint that returns or mutates protected data **MUST** re-check
> authorization on the .NET backend. The hooks in this package help apps
> hide controls the current user cannot use; they do not — and cannot —
> stop a user from issuing the underlying API call.

The browser is hostile territory. An attacker can:

- pause the JS engine and flip `hasPermission(...)` to `true`,
- replay an authenticated XHR with a different payload from DevTools,
- run a custom userscript or browser extension that mounts the gated
  component without ever invoking `usePermissions()`.

For that reason the framework draws a hard line between **UX gating** and
**enforcement**:

| Layer       | Job                                                              | Where it lives                                        |
| ----------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| UX gating   | Hide / disable controls the user cannot use, avoiding noisy 403. | `react-authorization` hooks in this package           |
| Enforcement | Reject the request (403) when the caller lacks the permission.   | `Granit.Authorization` (.NET backend, every endpoint) |

### Do

- Use `usePermissions().hasPermission('Module.Resource.Action')` to **hide**
  buttons, menu items, dashboard tiles, and form fields the user cannot
  use.
- Use the same call to **skip** a fetch that the user is not allowed to
  trigger (avoids a noisy 403 in the console and the network panel).
- Treat the result of `hasPermission` as a UX optimization: when you do not
  hide something, the worst case is a server-returned 403.

### Do NOT

- **Do NOT fetch sensitive data and then hide it via CSS / conditional
  rendering.** Anything the browser receives is reachable from DevTools.
  If the user is not authorized to see it, the server must not send it.

  ```tsx
  // WRONG — payload is already in memory
  const { data } = useSensitiveData();
  if (!hasPermission('Sensitive.Read')) return null;
  return <Display data={data} />;

  // RIGHT — query skipped client-side, AND server rejects unauthorized calls
  const { hasPermission } = usePermissions();
  const { data } = useSensitiveData({ enabled: hasPermission('Sensitive.Read') });
  return <Display data={data} />;
  ```

- **Do NOT rely on `disabled` / `hidden` attributes for security.** A
  user can re-enable them in DevTools and submit the form. The server
  must validate every field, every transition, every command.
- **Do NOT skip the server-side check because "the UI already prevents
  it".** Defense in depth — the server is the only authoritative answer
  to "is this caller allowed to do this".
- **Do NOT log or display the full permissions catalog of the current
  user beyond what the UI needs.** Permissions are PII-adjacent in
  multi-tenant contexts.

### Cross-tenant guarantees

In multi-tenant apps, the tenant header (`X-Tenant-Id`) is injected by
`@granit/api-client` from the active `TenantProvider`. Switching tenant
must:

1. update the React Query cache (use `useClearQueriesOnTenantChange`
   from `@granit/react-multi-tenancy`),
2. let `usePermissions()` refetch — its query key includes the current
   user / token so it invalidates implicitly on auth changes; if you
   resolve tenant from URL only, double-check the refetch fires on
   tenant change.

A stale `permissions` object served briefly under the wrong tenant is a
**confidentiality issue**, not just a UX bug.

### Threat model — what this package defends against

| Threat                                                     | Defense                                          |
| ---------------------------------------------------------- | ------------------------------------------------ |
| User sees a button they cannot use, clicks, gets 403       | UX gating via `hasPermission`                    |
| User crafts XHR for a forbidden endpoint                   | Out of scope — server enforces                   |
| Compromised browser extension reads in-memory permissions  | Out of scope — assume server enforcement         |
| Stale permissions after tenant switch                      | when `useClearQueriesOnTenantChange` is wired    |
| Stale permissions after back-channel logout                | via 401 interceptor in `@granit/api-client`      |

For the full client-side security posture, see
`granit-docs/src/content/docs/frontend/security/client-authorization.mdx`.

## Out of scope

- **Rendering** — role panels, grant/role-metadata tables, and the permission-side
  badge live in [`@granit/react-ui-authorization`](../react-ui-authorization). This
  package is headless.
- **DTOs and HTTP transport** — owned by [`@granit/authorization`](../authorization)
  (mirror of `Granit.Authorization`); hooks here only adapt them to React Query.
- **Authentication** — issuing/refreshing tokens is `@granit/authentication` and the
  BFF; this package consumes the already-authenticated Axios client.

## License

Apache-2.0
