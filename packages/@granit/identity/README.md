# @granit/identity

Provider-agnostic **identity administration** SDK — the framework-level TypeScript
counterpart of the .NET `Granit.Identity` module
(`granit-dotnet/src/Granit.Identity`, contract:
[`contracts/openapi/identity.json`](../../../contracts/openapi/identity.json)).

This is the framework-agnostic **core** layer: types, HTTP client functions and the
permission catalog needed to drive an identity-provider admin surface (Keycloak, Entra
ID, …) and the caller's own session self-service from any client — React, React Native,
a CLI, tests. It holds **no** React, DOM or Node-only dependency. The React Query
hooks/providers layer lives in [`@granit/react-identity`](../react-identity); the admin
feature kit (user list/detail, roles, groups, sessions, devices, attributes, cache) lives
in [`@granit/react-ui-identity`](../react-ui-identity). The shared, transport-neutral
session-risk and device contracts live in
[`@granit/identity-abstractions`](../identity-abstractions) and are re-exported here for
convenience.

Every call takes the centralized `AxiosInstance` plus a `basePath`. The base path is the
endpoint group's collection root, so the same functions work regardless of where the host
app mounts the route — the identity-provider admin surface, the user-cache surface and the
caller's own `/sessions` surface each have their own root. Functions never assume an
absolute URL.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published to a
public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors)
  passed into every call.
- `@granit/types` — branded id types (`UserId`, `EntityId`) and `ISODateString`.
- `@granit/query-engine` — `PagedResult` / `PaginationParams` for cached-user listing.
- `@granit/ip-geolocation` — the `GeoLocation` contract on session/device responses.
- `@granit/identity-abstractions` — the shared `DeviceKind` / `UserSessionRiskLevel`
  contracts.

## Quick start

```ts
import {
  searchUsers,
  setUserEnabled,
  assignRole,
  listMyUserSessions,
  revokeMyOtherUserSessions,
  composeDeviceLabel,
  IdentityPermissions,
} from '@granit/identity';
import type { DeviceLabelStrings } from '@granit/identity';

// 1. Admin: page the cached user directory (query-engine pagination).
const page = await searchUsers(client, '/api/v1/identity/users', { search: 'ada' });

// 2. Admin: act on a provider user. Role/group names are passed by name, not id.
const userId = page.items[0]!.userId;
await setUserEnabled(client, '/api/v1/identity/provider', userId, { enabled: false });
await assignRole(client, '/api/v1/identity/provider', userId, 'auditor');

// 3. Self-service: the caller's own sessions ("log out everywhere else").
const sessions = await listMyUserSessions(client, '/api/v1/identity');
const { revokedCount } = await revokeMyOtherUserSessions(client, '/api/v1/identity');

// 4. Compose a localized device label (strings come from the app's i18n layer).
const labels: DeviceLabelStrings = {
  kind: { Browser: 'Browser', BrowserExtension: 'Extension', MobileApp: 'Mobile app' },
  on: 'on',
};
const label = composeDeviceLabel(
  { kind: 'Browser', browser: 'Firefox', operatingSystem: 'Linux' },
  labels
); // → "Firefox on Linux"

// Gate UI on the backend permission catalog (enforcement stays server-side).
const canManage = IdentityPermissions.Users.Manage; // 'Identity.Users.Manage'
```

## Public API

Every function is `(client, basePath, …) => Promise<…>`. The `basePath` differs per group:
the identity-provider admin functions take the provider root, the cache functions take the
cache root, the self-service functions take the `/sessions`-parent root.

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `IdentityUser` | type | Cached identity user (id, name, email, enabled, metadata) |
| `IdentityUserPage` | type | `PagedResult<IdentityUser>` for cache listing |
| `IdentityUserListParams` | type | `PaginationParams & { search? }` for cache search |
| `IdentityUserCacheStats` | type | Cache size + stale count + sync timestamps |
| `IdentityUserCacheSyncAllResult` | type | `{ syncedCount }` from a full sync |
| `IdentityUserCacheSyncStaleResult` | type | `{ refreshedCount }` from a stale sync |
| `IdentityRole` / `IdentityRoleId` | type | Provider role + branded id |
| `IdentityGroup` / `IdentityGroupId` | type | Provider group (recursive `subGroups`) + branded id |
| `UserSessionResponse` / `UserSessionId` | type | One session (current flag, IP, geo, risk) + branded id |
| `UserDeviceResponse` / `UserDeviceId` | type | One device (kind, OS, browser, session count) + branded id |
| `UserSessionsRevokedResponse` | type | `{ revokedCount }` from a bulk revoke |
| `UserSessionRiskLevel` / `DeviceKind` | type | Re-exported risk + device-kind enums |
| `GeoLocation` | type | Re-exported approximate session/device location |
| `SessionReviewContextResponse` | type | "Was this you?" context (country, prior decision) |
| `SessionReviewDecision` | type | `'Confirmed' \| 'Denied'` |
| `SessionReviewDecisionRequest` | type | `POST .../sessions/review` body (token + decision) |
| `SessionReviewResultResponse` | type | Recorded decision + idempotent `applied` flag |
| `IdentityPasswordChangedAtResponse` | type | `{ changedAt: ISODateString \| null }` |
| `IdentityUserCreateRequest` | type | `POST .../users` body |
| `IdentityUserUpdateRequest` | type | `PUT .../users/{id}` body (incl. custom `attributes`) |
| `IdentityUserSetEnabledRequest` | type | `PATCH .../users/{id}/enabled` body |
| `IdentitySetTemporaryPasswordRequest` | type | `POST .../password/temporary` body |
| `IdentityProviderUserListParams` | type | `{ search?, first?, max? }` for provider listing |
| `IdentityProviderCapabilitiesResponse` | type | What the active provider supports |
| `DeviceLabelStrings` | type | Localized strings consumed by `composeDeviceLabel` |
| `getIdentityCapabilities` | fn | `GET {base}/capabilities` |
| `searchUsers` | fn | `GET {base}/` — paged cached-user search |
| `getUserById` | fn | `GET {base}/{userId}` (cache) |
| `batchResolveUsers` | fn | `POST {base}/batch` — resolve many ids at once |
| `getCacheStats` | fn | `GET {base}/stats` |
| `syncUsers` | fn | `POST {base}/sync` — sync specific ids |
| `syncAllUsers` | fn | `POST {base}/sync-all` — full sync |
| `syncStaleUsers` | fn | `POST {base}/sync-stale` — stale-only sync |
| `eraseUserCache` | fn | `DELETE {base}/{userId}` — GDPR hard delete |
| `pseudonymizeUserCache` | fn | `PATCH {base}/{userId}/pseudonymize` — GDPR Art. 18 |
| `listProviderUsers` | fn | `GET {base}/users` (provider) |
| `getProviderUser` | fn | `GET {base}/users/{userId}` (provider) |
| `createUser` | fn | `POST {base}/users` (501 if unsupported) |
| `updateUser` | fn | `PUT {base}/users/{userId}` |
| `setUserEnabled` | fn | `PATCH {base}/users/{userId}/enabled` |
| `listRoles` / `listRoleMembers` | fn | `GET .../roles`, `.../roles/{name}/members` |
| `listUserRoles` | fn | `GET .../users/{userId}/roles` |
| `assignRole` / `removeRole` | fn | `PUT` / `DELETE .../roles/{name}` (idempotent) |
| `listGroups` / `listUserGroups` | fn | `GET .../groups`, `.../users/{userId}/groups` |
| `addUserToGroup` / `removeUserFromGroup` | fn | `PUT` / `DELETE .../groups/{id}` (idempotent) |
| `listUserSessions` / `listUserDevices` | fn | Admin: another user's sessions/devices |
| `terminateSession` | fn | `DELETE .../sessions/{id}` (501 if unsupported) |
| `terminateAllSessions` | fn | `DELETE .../sessions` (a user's sessions) |
| `listMyUserSessions` / `listMyUserDevices` | fn | Self-service: the caller's own |
| `revokeMyUserSession` | fn | `DELETE {base}/sessions/{id}` (not the current one) |
| `revokeMyOtherUserSessions` | fn | `DELETE {base}/sessions` — log out everywhere else |
| `getSessionReviewContext` | fn | `GET {base}/sessions/review?token=` (anonymous) |
| `submitSessionReview` | fn | `POST {base}/sessions/review` (anonymous, single-use) |
| `getPasswordChangedAt` | fn | `GET .../password/changed-at` |
| `sendPasswordResetEmail` | fn | `POST .../password/reset-email` (501 if unsupported) |
| `setTemporaryPassword` | fn | `POST .../password/temporary` |
| `composeDeviceLabel` | fn | Headless `UserDeviceResponse` → localized label |
| `IdentityPermissions` | const | Backend permission catalog (`Identity.{Resource}.{Action}`) |

## Out of scope / caveats

- **Permissions are UX hints, not enforcement.** `IdentityPermissions` mirrors the backend
  catalog so the UI can hide controls; authorization is enforced per-endpoint by
  `Granit.Identity` on the server. Never treat a client-side check as a security boundary.
- **Provider capabilities gate features, not just controls.** Capability-dependent calls
  (`createUser`, `sendPasswordResetEmail`, `terminateSession`) return **501** when the
  active provider does not support them. Read `getIdentityCapabilities` first and gate the
  UI, but still handle 501 — the capability flags can drift from the live provider.
- **GDPR data minimisation on sessions.** `ipAddress` is masked to its network portion
  unless the deployment opts into `ExposeRawIpAddress`; `userAgent` is client-controlled
  free text — treat it as display-only, length-bound it, and **never interpolate it into
  HTML**. `location` / `riskLevel` / `riskReasons` are all nullable.
- **GDPR erasure vs. pseudonymization.** `eraseUserCache` hard-deletes the cache entry;
  `pseudonymizeUserCache` (Art. 18) replaces PII with placeholders but keeps the row for
  referential integrity. Pick deliberately.
- **Anonymous session review.** `getSessionReviewContext` / `submitSessionReview` are
  token-protected and unauthenticated — the token from the security-alert email is the
  only credential. It travels in the query string / body by design; never log or echo it.
  An invalid or expired token surfaces as a `400`. `submitSessionReview` is single-use: a
  repeat returns `applied: false` with the already-recorded decision.
- **Roles and groups are addressed by name/id, not by branded type.** `assignRole` /
  `removeRole` take the role *name*; `addUserToGroup` / `removeUserFromGroup` take the
  group *id* as a plain string. The `IdentityRoleId` / `IdentityGroupId` brands type the
  *response* records, not these mutation arguments.
- **i18n is the caller's job.** `composeDeviceLabel` is headless: it takes
  `DeviceLabelStrings` resolved from the app's i18n layer (the `identity` bundle shipped by
  `@granit/react-identity`). No locale data ships here.
- **No React, no hooks.** React Query hooks, providers and query-key factories live in
  `@granit/react-identity`; admin screens live in `@granit/react-ui-identity`.

## License

Apache-2.0
