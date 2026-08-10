# @granit/react-openiddict-admin

React hooks + provider for the Granit **admin / OpenIddict** module — admin user
listing & impersonation, OIDC application/scope/authorization administration, and the
public OIDC flow drivers (explicit-consent redirect + RFC 8628 device verification).
This is the **React hooks layer**: it wraps the framework-agnostic Axios calls and DTOs
from [`@granit/openiddict-admin`](../openiddict-admin) in TanStack Query hooks behind a
shared `OpenIddictAdminProvider` for client / base-path / query-key configuration. It
holds no rendering — dialogs, tables, and flow pages live one layer up.

The split is three packages over the same .NET `Granit.OpenIddict.Endpoints` backend
(contract: `contracts/openapi/openiddict.json`):

- [`@granit/openiddict-admin`](../openiddict-admin) — framework-agnostic core: DTOs +
  Axios functions (`listUsers`, `impersonateUser`, `listApplications`, …).
- `@granit/react-openiddict-admin` (this package) — React Query hooks + provider.
- [`@granit/react-ui-openiddict-admin`](../react-ui-openiddict-admin) — admin UI kit:
  zod-validated application/scope/authorization CRUD dialogs plus the public consent
  prompt and device-verification pages.

> User / role / group CRUD lives in [`@granit/react-identity`](../react-identity)
> (backed by `/identity/provider/*`). This package owns only the QueryEngine-backed
> admin user **listing** and the **impersonation** endpoint; the rest is OIDC server
> administration.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published for
app consumption through a public registry. A consumer must declare these peers:

- `@granit/openiddict-admin` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for the
  Axios client when `config.client` is omitted.
- `@granit/logger` — `createLogger`; device-verification failures are logged by OAuth
  error code only.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `@granit/query-engine` / `@granit/react-query-engine` (**optional**) — `QueryMetadata`
  for the admin-user listing surface and its test handlers.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-openiddict-admin/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { OpenIddictAdminProvider, useAdminUsers } from '@granit/react-openiddict-admin';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <OpenIddictAdminProvider config={{ client: useGranitClient() }}>
      {children}
    </OpenIddictAdminProvider>
  );
}

function UserList() {
  const { data, isLoading } = useAdminUsers();
  if (isLoading) return null;
  return (
    <ul>
      {data?.items.map((u) => (
        <li key={u.id}>{u.email}</li>
      ))}
    </ul>
  );
}
```

OIDC server administration combines query hooks with mutations that auto-invalidate
their collection on success:

```tsx
import {
  useOidcApplications,
  useCreateOidcApplication,
  useRotateApplicationSecret,
} from '@granit/react-openiddict-admin';

function ApplicationsPanel() {
  const { data: apps } = useOidcApplications();
  const create = useCreateOidcApplication();
  const rotate = useRotateApplicationSecret();

  return apps?.map((app) => (
    <button
      key={app.clientId}
      type="button"
      // Show the returned plaintext secret ONCE — it is never retrievable again.
      onClick={() => rotate.mutate(app.clientId)}
    >
      Rotate {app.clientId}
    </button>
  ));
}
```

The public OIDC flow pages are driven by `useConsentFlow` (parses the `returnUrl`,
POSTs the authorization grant, redirects on approval) and `useDeviceVerification`
(submits the user code to the RFC 8628 verification endpoint). Both must be mounted
inside an `<OpenIddictAdminProvider>` and use the authenticated, non-admin OIDC base
path (`config.oidcBasePath`).

## Public API

| Symbol | Kind | Purpose | | | |
| ------------------------------- | -------- | -------------------------------------------------------------------- | | | |
| `OpenIddictAdminProvider` | provider | Supplies client, base path, OIDC base path, query-key prefix below | | | |
| `useAdminConfig` | hook | Read the resolved config; throws outside the provider | | | |
| `buildAdminQueryKey` | fn | Query-key factory honoring the configured `queryKeyPrefix` | | | |
| `useAdminUsers` | hook | QueryEngine-backed paginated admin user listing | | | |
| `useImpersonateUser` | hook | `POST` impersonation — returns new tokens for the target user | | | |
| `useOidcApplications` | hook | List all OIDC applications | | | |
| `useOidcApplication` | hook | Fetch one application by client id (`null` on 404, skipped if no id) | | | |
| `useCreateOidcApplication` | hook | Create an application (invalidates the list) | | | |
| `useUpdateOidcApplication` | hook | Update an application (invalidates the list) | | | |
| `useDeleteOidcApplication` | hook | Delete an application (invalidates the list) | | | |
| `useRotateApplicationSecret` | hook | Rotate the client secret — returns the new plaintext secret once | | | |
| `useOidcScopes` | hook | List all OIDC scopes | | | |
| `useCreateOidcScope` | hook | Create a scope (invalidates the list) | | | |
| `useUpdateOidcScope` | hook | Update a scope by name (invalidates the list) | | | |
| `useDeleteOidcScope` | hook | Delete a scope by name (invalidates the list) | | | |
| `useOidcAuthorizations` | hook | List authorizations with optional filter params | | | |
| `useCreateOidcAuthorization` | hook | Create an authorization / admin consent grant (invalidates the list) | | | |
| `useRevokeAuthorization` | hook | Revoke a single authorization (invalidates the list) | | | |
| `useRevokeUserAuthorizations` | hook | Revoke every authorization for a user (invalidates the list) | | | |
| `useConsentApplication` | hook | Public application display info for consent page (`null` on 404) | | | |
| `useConsentFlow` | hook | Drives the explicit-consent redirect flow (grant / deny) | | | |
| `useDeviceVerification` | hook | Drives the RFC 8628 device-code verification page | | | |
| `openIddictAdminKeys` | const | Static query-key factory (`all` / `users` / `applications` / …) | | | |
| `OpenIddictAdminConfig` | type | Provider input (optional client / basePath / oidcBasePath / prefix) | | | |
| `ResolvedOpenIddictAdminConfig` | type | Provider output with the resolved required client | | | |
| `OpenIddictAdminProviderProps` | type | `{ config, children }` | | | |
| `ConsentApplicationInfo` | type | `{ clientId, displayName }` for the consent prompt | | | |
| `ConsentFlowState` | type | `useConsentFlow` return (`clientId`, `scopes`, `grant`, `deny`, …) | | | |
| `DeviceVerificationState` | type | `useDeviceVerification` return (`status`, `errorCode`, `submit`) | | | |
| `DeviceVerificationStatus` | type | `'idle' \                                                            | 'pending' \ | 'success' \ | 'error'` |

`./testing` subpath (requires the optional `msw` peer): `createOpenIddictAdminHandlers`
(MSW handlers) with the `adminUserQueryMetadata`, `oidcApplicationQueryMetadata`,
`oidcScopeQueryMetadata`, and `oidcAuthorizationQueryMetadata` query-metadata fixtures
plus the `mockAdminUsers`, `mockOidcApplications`, `mockOidcScopes`, and
`mockOidcAuthorizations` data fixtures.

## Out of scope / caveats

- **Rotated secrets are shown once.** `useRotateApplicationSecret` (and create) return
  the plaintext client secret in the response body; the backend never stores or returns
  it again. Surface it to the admin immediately and never persist it client-side.
- **User codes are credentials.** `useDeviceVerification` logs only the OAuth error
  code on failure (via `@granit/logger`); the submitted `user_code` is a credential and
  is never logged. Do not widen the logged payload.
- **Impersonation is privileged.** `useImpersonateUser` returns a fresh token set for
  the target subject; gate the control behind the relevant admin permission
  (`OpenIddictPermissions` in [`@granit/openiddict-admin`](../openiddict-admin)) — the
  client-side check is a UX hint, the .NET backend is the authoritative gate.
- **User / role / group CRUD is elsewhere** — [`@granit/react-identity`](../react-identity)
  owns the identity provider surface; this package only lists admin users.
- **Rendering** — dialogs, tables, and the consent / device-verification pages live in
  [`@granit/react-ui-openiddict-admin`](../react-ui-openiddict-admin). This package is
  headless.
- **DTOs and HTTP transport** — owned by [`@granit/openiddict-admin`](../openiddict-admin)
  (mirror of `Granit.OpenIddict.Endpoints`); hooks here only adapt them to React Query.

## License

Apache-2.0
