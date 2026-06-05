# @granit/react-authorization

React hooks for `@granit/authorization` -- permission checking, definitions, role grants.

## Installation

```bash
pnpm add @granit/react-authorization
```

## API

### Hooks

- `usePermissions(options?)` -- check current user permissions
- `usePermissionDefinitions(options?)` -- fetch all permission definitions
- `useRolePermissions(options?)` -- fetch permissions for a specific role
- `usePermissionGrant(options?)` -- grant or revoke a permission
- `usePermissionGrants(options, request?)` -- paginated permission-grants query surface (`GET /grants`)
- `usePermissionGrantMeta(options)` -- query metadata for permission grants (`GET /grants/meta`)
- `useRoleMetadata(options, request?)` -- paginated role-metadata query surface (`GET /role-metadata`)
- `useRoleMetadataMeta(options)` -- query metadata for role metadata (`GET /role-metadata/meta`)

### Utilities

- `buildPermissionQueryKey(config, ...segments)` -- React Query key factory

### Types

- `UsePermissionGrantReturn` -- return type of `usePermissionGrant`

## Usage

```tsx
import { usePermissions } from '@granit/react-authorization';

function ProtectedButton() {
  const { data: permissions } = usePermissions();

  if (!permissions?.isGranted('documents.create')) {
    return null;
  }

  return <button>Create Document</button>;
}
```

## Security model

> **Client-side permission checks are a UX hint, not a security boundary.**
> Every endpoint that returns or mutates protected data **MUST** re-check
> authorization on the .NET backend. The hooks in this package help apps
> hide controls the current user cannot use; they do not — and cannot —
> stop a user from issuing the underlying API call.

The browser is hostile territory. An attacker can:

- pause the JS engine and flip `permissions.isGranted(...)` to `true`,
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

- Use `usePermissions().isGranted('Module.Resource.Action')` to **hide**
  buttons, menu items, dashboard tiles, and form fields the user cannot
  use.
- Use the same call to **skip** a fetch that the user is not allowed to
  trigger (avoids a noisy 403 in the console and the network panel).
- Treat the result of `isGranted` as a UX optimization: when you do not
  hide something, the worst case is a server-returned 403.

### Do NOT

- **Do NOT fetch sensitive data and then hide it via CSS / conditional
  rendering.** Anything the browser receives is reachable from DevTools.
  If the user is not authorized to see it, the server must not send it.

  ```tsx
  // ❌ WRONG — payload is already in memory
  const { data } = useSensitiveData();
  if (!can('Sensitive.Read')) return null;
  return <Display data={data} />;

  // ✅ RIGHT — query skipped client-side, AND server rejects unauthorized calls
  const can = usePermissions().data?.isGranted('Sensitive.Read');
  const { data } = useSensitiveData({ enabled: can });
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

| Threat                                                    | Defense                                          |
| --------------------------------------------------------- | ------------------------------------------------ |
| User sees a button they cannot use, clicks, gets 403      | ✅ UX gating via `isGranted`                     |
| User crafts XHR for a forbidden endpoint                  | ❌ Out of scope — server enforces                |
| Compromised browser extension reads in-memory permissions | ❌ Out of scope — assume server enforcement      |
| Stale permissions after tenant switch                     | ✅ when `useClearQueriesOnTenantChange` is wired |
| Stale permissions after back-channel logout               | ✅ via 401 interceptor in `@granit/api-client`   |

For the full client-side security posture, see
`granit-docs/security/client-authorization.md`.

## License

Apache-2.0
