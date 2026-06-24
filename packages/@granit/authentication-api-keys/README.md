# @granit/authentication-api-keys

Framework-agnostic **API key** SDK — the TypeScript counterpart of the .NET
`Granit.Authentication.ApiKeys` module. It mirrors the wire DTOs, exposes the
Axios HTTP client for the api-keys endpoints, and ships the permission constants
plus the spec-generated validation constraints.

It holds **no** React, DOM or Node-only dependency: any client (React, React
Native, a CLI, tests) can drive the api-key lifecycle from this package. The
React Query hooks live in
[`@granit/react-authentication-api-keys`](../react-authentication-api-keys); the
ready-made admin feature kit (list grid, create form, detail/scopes page) lives
in
[`@granit/react-ui-authentication-api-keys`](../react-ui-authentication-api-keys).

The api-key lifecycle is create → (rotate | update scopes) → revoke. Creating or
rotating a key returns a one-time `rawSecret` that the backend never persists in
plaintext and never replays — surface it to the operator exactly once. The
listing surface is a QueryEngine grid; its summary rows deliberately omit the
heavyweight `permissions` and `allowedCidrs` collections, which are only
available on the detail endpoint.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the centralized Axios client (CSRF, auth, tenant
  interceptors); every call here takes an `AxiosInstance`.
- `@granit/query-engine` — `QueryRequest` / `PagedResult` / `QueryMetadata` and
  the `getPage` / `getQueryMeta` helpers backing the listing surface.
- `@granit/types` — branded `EntityId` and `ISODateString` primitives.
- `@granit/validation` — `SchemaConstraints` shape for the generated constraints.

## Quick start

```ts
import {
  createApiKey,
  listApiKeys,
  rotateApiKey,
  revokeApiKey,
  ApiKeyQuickFilters,
} from '@granit/authentication-api-keys';
import type { ApiKeyCreateRequest } from '@granit/authentication-api-keys';

// `basePath` is the module mount point; calls append `/api-keys` to it.
const basePath = '/api/v1/authentication';

// 1. List active keys (QueryEngine grammar). Pass a quick filter to widen.
const page = await listApiKeys(client, basePath, {
  pageSize: 20,
  sort: '-createdAt',
  quickFilters: [ApiKeyQuickFilters.IncludeRevoked],
});

// 2. Create a key. The response carries the raw secret — show it ONCE.
const request: ApiKeyCreateRequest = {
  name: 'billing-sync',
  type: 'Secret',
  environment: 'live',
  permissions: ['Invoicing.Read'],
};
const created = await createApiKey(client, basePath, request);
console.warn('copy now, shown once:', created.rawSecret);

// 3. Rotate (issues a new secret, retires the old key) or revoke.
const rotated = await rotateApiKey(client, basePath, created.id);
await revokeApiKey(client, basePath, rotated.newKeyId);
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `ApiKeyId` | type | Branded `EntityId<'ApiKey'>` |
| `ApiKeyType` | type | `'Secret' \| 'Publishable' \| 'Webhook' \| 'Ephemeral'` |
| `CacheBehavior` | type | `'Normal' \| 'NoCache'` |
| `ApiKeyResponse` | type | Full detail DTO (`GET /api-keys/{id}`), with scopes + CIDRs |
| `ApiKeyListItemResponse` | type | Summary grid row (no `permissions` / `allowedCidrs`) |
| `ApiKeyListPage` | type | `PagedResult<ApiKeyListItemResponse>` |
| `ApiKeyCreateRequest` | type | `POST /api-keys` body |
| `ApiKeyCreateResponse` | type | Create result — includes the one-time `rawSecret` |
| `ApiKeyRotateResponse` | type | Rotate result — new + old key ids and the one-time `rawSecret` |
| `ApiKeyUpdateScopesRequest` | type | `PUT /api-keys/{id}/scopes` body |
| `ApiKeyQuickFilter` | type | `'active' \| 'includeRevoked'` |
| `ListApiKeysParams` | type | Alias of QueryEngine `QueryRequest` |
| `ApiKeyQuickFilters` | const | Named quick-filter values (`Active`, `IncludeRevoked`) |
| `ApiKeyPermissions` | const | Permission strings nested under `Keys` (`Keys.Read`, `Keys.Create`, `Keys.Revoke`, `Keys.Rotate`, `Keys.UpdateScopes`) |
| `apiKeysConstraints` | const | Spec-generated `SchemaConstraints` (create + update-scopes) |
| `listApiKeys` | fn | `GET {basePath}/api-keys` (QueryEngine page) |
| `getApiKeysQueryMeta` | fn | `GET {basePath}/api-keys/meta` (grid metadata) |
| `getApiKey` | fn | `GET {basePath}/api-keys/{id}` (detail) |
| `createApiKey` | fn | `POST {basePath}/api-keys` |
| `revokeApiKey` | fn | `POST {basePath}/api-keys/{id}/revoke` |
| `rotateApiKey` | fn | `POST {basePath}/api-keys/{id}/rotate` |
| `updateApiKeyScopes` | fn | `PUT {basePath}/api-keys/{id}/scopes` |

`apiKeysConstraints` is **generated** from `contracts/openapi/api-keys.json` by
`scripts/generate-front-constraints.mjs` and regenerated on pre-commit — never
hand-edit it. Consume it through `createConstraintsResolver` from
`@granit/react-validation`; the backend `Granit.Validation` codes
(`InvalidEnvironment`, `MaxPermissions`, `InvalidCidrNotation`,
`ExpirationMustBeFuture`) own the human-readable messages.

## Out of scope / caveats

- **Secret handling.** `rawSecret` (on create and rotate) is the only moment the
  cleartext key exists client-side. Render it once for copy, never persist it,
  never log it. The backend stores only a hash; there is no "reveal" endpoint.
- **List vs. detail.** `ApiKeyListItemResponse` drops `permissions` and
  `allowedCidrs` by design — fetch `getApiKey` on demand when a row needs them.
- **No React here.** Query keys, hooks and providers belong to
  [`@granit/react-authentication-api-keys`](../react-authentication-api-keys);
  the admin screens to
  [`@granit/react-ui-authentication-api-keys`](../react-ui-authentication-api-keys).
- **Authorization is server-enforced.** `ApiKeyPermissions` strings let an app
  gate UI; they are a UX hint, not a security boundary — the .NET endpoints
  re-check every call.

## License

Apache-2.0
