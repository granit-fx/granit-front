# @granit/openiddict-admin

Framework-agnostic **core** SDK for the OpenIddict admin surface — the TypeScript
counterpart of the .NET `Granit.OpenIddict.Endpoints` module
(`contracts/openapi/openiddict.json`). It exposes the wire types, Axios-based HTTP
functions and permission constants needed to drive OIDC application / scope /
authorization administration, plus admin user listing and impersonation, from any
client. It holds **no** React, DOM or Node-only dependency.

This is the lowest layer of a three-package split: the React Query hooks +
query-key factories live in [`@granit/react-openiddict-admin`](../react-openiddict-admin),
and the admin feature kit (zod-validated dialog forms, the OIDC application / scope
/ authorization CRUD screens, and the public consent + RFC 8628 device-verification
flow pages) lives in [`@granit/react-ui-openiddict-admin`](../react-ui-openiddict-admin).

> **User / role / group CRUD lives in [`@granit/identity`](../identity)**
> (`/identity/provider/*`). This package keeps only the endpoints owned by the
> admin module itself: the QueryEngine-backed user **listing**, **impersonation**,
> and the OpenIddict management surface.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
to a public registry for app consumption. Declare the two peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/query-engine` — supplies `PagedResult<T>`, the page shape returned by
  `listUsers`.

## Quick start

Every function takes the shared `client` and a `basePath` (the admin module root,
e.g. `/api/v1/admin`); the function appends its own sub-path (`/users`,
`/oidc/applications`, …). Pass the same `client` so CSRF, auth and tenant headers
are applied.

```ts
import {
  listUsers,
  impersonateUser,
  listApplications,
  createApplication,
  rotateApplicationSecret,
  createAuthorization,
  OpenIddictPermissions,
} from '@granit/openiddict-admin';

const basePath = '/api/v1/admin';

// QueryEngine-backed, paginated user listing.
const page = await listUsers(client, basePath, { search: 'ada', page: 1, pageSize: 20 });
// page.items: AdminUser[], page.totalCount, … (PagedResult<AdminUser>)

// Short-lived impersonation tokens — DO NOT log or persist these.
const tokens = await impersonateUser(client, basePath, page.items[0]!.userId);
// tokens.accessToken / refreshToken / expiresIn

// OIDC application admin.
const apps = await listApplications(client, basePath);
const created = await createApplication(client, basePath, {
  clientId: 'showcase-admin',
  displayName: 'Showcase Admin',
  redirectUris: ['https://admin.example.com/callback'],
  clientSide: 2, // MultiTenancySides: 0=None 1=Host 2=Tenant 3=Both
});

// Secret rotation returns the new secret ONCE — surface it, never store it.
const { newClientSecret } = await rotateApplicationSecret(client, basePath, created.clientId!);

// Admin consent grant.
await createAuthorization(client, basePath, {
  subject: page.items[0]!.userId,
  clientId: 'showcase-admin',
  scopes: ['openid', 'profile'],
});

// Permission keys — gate UI with @granit/react-authorization, enforce on the backend.
OpenIddictPermissions.Applications.Rotate; // 'OpenIddict.Applications.Rotate'
```

## Public API

| Symbol                                | Kind  | Purpose                                                           |
| ------------------------------------- | ----- | ----------------------------------------------------------------- |
| `AdminUser`                           | type  | Admin user descriptor (`userId`, `username`, `email`, `enabled`)  |
| `AdminUserListParams`                 | type  | `GET {basePath}/users` query (`search`, `page`, `pageSize`)       |
| `AdminUserPage`                       | type  | `PagedResult<AdminUser>` — paginated user listing                 |
| `AdminImpersonationResult`            | type  | `{ accessToken, refreshToken, expiresIn }` from impersonation     |
| `AdminOidcApplicationResponse`        | type  | OIDC application descriptor (`clientId`, URIs, `clientSide`, …)   |
| `AdminOidcCreateApplicationRequest`   | type  | `POST .../oidc/applications` body                                 |
| `AdminOidcUpdateApplicationRequest`   | type  | `PUT .../oidc/applications/{clientId}` body (`null` clears field) |
| `AdminOidcRotateSecretResponse`       | type  | `{ clientId, displayName, newClientSecret }` — secret shown once  |
| `AdminOidcScopeResponse`              | type  | OIDC scope descriptor (`name`, `displayName`, `resources`)        |
| `AdminOidcCreateScopeRequest`         | type  | `POST .../oidc/scopes` body                                       |
| `AdminOidcUpdateScopeRequest`         | type  | `PUT .../oidc/scopes/{scopeName}` body (`null` clears field)      |
| `AdminOidcAuthorizationResponse`      | type  | OIDC authorization descriptor (`subject`, `clientId`, `scopes`)   |
| `AdminOidcCreateAuthorizationRequest` | type  | `POST .../oidc/authorizations` body (admin consent grant)         |
| `AdminOidcAuthorizationListParams`    | type  | `GET .../oidc/authorizations` query (`userId`, `clientId`)        |
| `listUsers`                           | fn    | `GET {basePath}/users` → `AdminUserPage`                          |
| `impersonateUser`                     | fn    | `POST {basePath}/users/{id}/impersonate` → tokens                 |
| `listApplications`                    | fn    | `GET {basePath}/oidc/applications`                                |
| `getApplication`                      | fn    | `GET {basePath}/oidc/applications/{clientId}`                     |
| `getApplicationInfo`                  | fn    | `GET {oidcBasePath}/applications/{clientId}` — public consent     |
| `createApplication`                   | fn    | `POST {basePath}/oidc/applications`                               |
| `updateApplication`                   | fn    | `PUT {basePath}/oidc/applications/{clientId}`                     |
| `deleteApplication`                   | fn    | `DELETE {basePath}/oidc/applications/{clientId}`                  |
| `rotateApplicationSecret`             | fn    | `POST {basePath}/oidc/applications/{clientId}/rotate-secret`      |
| `listScopes`                          | fn    | `GET {basePath}/oidc/scopes`                                      |
| `createScope`                         | fn    | `POST {basePath}/oidc/scopes`                                     |
| `updateScope`                         | fn    | `PUT {basePath}/oidc/scopes/{scopeName}`                          |
| `deleteScope`                         | fn    | `DELETE {basePath}/oidc/scopes/{scopeName}`                       |
| `createAuthorization`                 | fn    | `POST {basePath}/oidc/authorizations` (admin consent grant)       |
| `listAuthorizations`                  | fn    | `GET {basePath}/oidc/authorizations` (filter by user / client)    |
| `revokeAuthorization`                 | fn    | `DELETE {basePath}/oidc/authorizations/{id}`                      |
| `revokeUserAuthorizations`            | fn    | `DELETE {basePath}/oidc/authorizations/user/{userId}`             |
| `OpenIddictPermissions`               | const | Permission key tree (`Applications`/`Scopes`/`Authorizations`)    |

`getApplicationInfo` is the only non-admin call: it takes the public OIDC base path
(not the admin `basePath`) and returns just `{ clientId, displayName }` for the
consent prompt — no permission required.

## Caveats

- **Secrets are shown once.** `rotateApplicationSecret` and a `clientSecret` passed
  to `createApplication` are sensitive. Surface `newClientSecret` to the admin
  inline and never log, persist client-side, or send it to telemetry.
- **Impersonation tokens are credentials.** `AdminImpersonationResult` holds a live
  access + refresh token. Hand them to the auth layer; never log them or write them
  to anywhere durable.
- **`signingKeyJwk` is a JSON string.** Private JWK params are stripped server-side;
  on update, an empty string clears the key while `null` leaves it unchanged.
- **Optionality mirrors the OpenAPI `required` array, not nullability.** Response
  fields typed `T | null` are *required keys with nullable values* (e.g.
  `clientId: string | null`); request fields typed `T?` are genuinely optional.
  On the update requests, an explicit `null` clears a field — distinct from omitting
  the key, which leaves it unchanged.
- **Permission constants gate UI only.** `OpenIddictPermissions` mirrors the backend
  permission keys for `@granit/react-authorization` UX gating. Enforcement is the
  .NET backend's job on every endpoint — the browser is hostile territory.

## License

Apache-2.0
