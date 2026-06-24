# @granit/react-identity

React hooks + provider for the Granit **identity** module — identity-provider
capabilities, the cached-user directory, provider user/role/group administration,
session & device management, password admin, GDPR cache operations, and the
anonymous "Was this you?" session-review flow. This is the **React hooks layer**:
it wraps the framework-agnostic Axios calls and DTOs from
[`@granit/identity`](../identity) in TanStack Query hooks with a shared
`IdentityProvider` for client/base-path/query-key configuration. It holds no
rendering — tables, panels, and forms live one layer up.

The split is three packages over the same .NET `Granit.Identity` backend (contract:
`contracts/openapi/identity.json`):

- [`@granit/identity`](../identity) — framework-agnostic core: DTOs + Axios
  functions (`getIdentityCapabilities`, `searchUsers`, `assignRole`, …).
- `@granit/react-identity` (this package) — React Query hooks + provider.
- [`@granit/react-ui-identity`](../react-ui-identity) — admin UI kit: user list /
  detail / create, password, groups, sessions, devices, attributes, roles, groups,
  and the identity cache, composed from this package and the foundation UI packages.

Session-risk and geo contracts are shared, not local — they live in
[`@granit/identity-abstractions`](../identity-abstractions) and re-export through
`@granit/identity` (`UserSessionRiskLevel`, `GeoLocation`).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/identity` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `@granit/query-engine` and `@granit/react-query-engine` (**optional**) — only the
  `./testing` subpath uses them, for the cached-user query metadata helper.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-identity/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client and the three base paths —
user cache, identity provider, self-service sessions), then call the hooks
anywhere below it.

```tsx
import { IdentityProvider, useIdentityCapabilities } from '@granit/react-identity';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  // Base paths default to /api/v1/identity/users, /api/v1/identity/provider,
  // and /api/v1 (self-service /sessions + /devices).
  return (
    <IdentityProvider config={{ client: useGranitClient() }}>
      {children}
    </IdentityProvider>
  );
}

function ResetButton({ userId }: { userId: string }) {
  const { data: caps } = useIdentityCapabilities();

  // Capabilities are stable for the backend deployment (staleTime: Infinity);
  // hide controls the active provider does not support.
  if (!caps?.supportsNativePasswordResetEmail) return null;
  return <button type="button">Send reset email</button>;
}
```

Admin screens combine the directory queries with provider mutations; every
mutation invalidates the affected query keys on success:

```tsx
import {
  useProviderUsers,
  useUserRoles,
  useAssignRole,
  useRemoveRole,
} from '@granit/react-identity';

function RoleEditor({ userId }: { userId: string }) {
  const { data: users } = useProviderUsers({ search: '', max: 50 });
  const { data: roles } = useUserRoles(userId); // disabled while userId is empty
  const assign = useAssignRole();
  const remove = useRemoveRole();

  const has = new Set(roles?.map((r) => r.name));
  return ['admin', 'user', 'auditor'].map((roleName) => (
    <Toggle
      key={roleName}
      checked={has.has(roleName)}
      onChange={(on) =>
        (on ? assign : remove).mutate({ userId, roleName })
      }
    />
  ));
}
```

End users manage their own footprint through the self-service hooks (no `userId`
— the backend scopes to the authenticated caller):

```tsx
import {
  useMyUserSessions,
  useRevokeMyOtherUserSessions,
} from '@granit/react-identity';

function SessionList() {
  const { data: sessions } = useMyUserSessions();
  const revokeOthers = useRevokeMyOtherUserSessions();

  return (
    <>
      {sessions?.map((s) => <SessionRow key={s.sessionId} session={s} />)}
      <button type="button" onClick={() => revokeOthers.mutate()}>
        Log out everywhere else
      </button>
    </>
  );
}
```

## Public API

| Symbol                                              | Kind     | Purpose                                                                 |
| --------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| `IdentityProvider`                                  | provider | Supplies client + three base paths + query-key prefix to hooks below it |
| `useIdentityConfig`                                 | hook     | Read the resolved config; throws outside a provider                     |
| `buildIdentityQueryKey`                             | fn       | Query-key factory honoring the configured `queryKeyPrefix`              |
| `useIdentityCapabilities`                           | hook     | `GET .../users/capabilities` — active provider feature flags (cached)   |
| `useIdentityUsers`                                  | hook     | `GET .../users` — paged/searchable cached-user directory                |
| `useIdentityUser`                                   | hook     | `GET .../users/{id}` — one cached user (disabled on empty id)           |
| `useIdentityCacheStats`                             | hook     | `GET .../users/stats` — total/stale entries + sync timestamps           |
| `useBatchResolveUsers`                              | hook     | `POST .../users/batch` — resolve many ids in one request                |
| `useIdentitySync`                                   | hook     | `sync` / `syncAll` / `syncStale` cache-refresh mutations                |
| `useIdentityRgpd`                                   | hook     | `erase` (Art. 17) / `pseudonymize` (Art. 18) cache mutations            |
| `useProviderUsers`                                  | hook     | `GET .../provider/users` — list/search provider users                   |
| `useProviderUser`                                   | hook     | `GET .../provider/users/{id}` — one provider user                       |
| `useCreateUser`                                     | hook     | `POST .../provider/users` mutation                                      |
| `useUpdateUser`                                     | hook     | `PUT .../provider/users/{id}` mutation                                  |
| `useSetUserEnabled`                                 | hook     | `PATCH .../provider/users/{id}/enabled` mutation                        |
| `useRoles`                                          | hook     | `GET .../provider/roles` — all provider roles                           |
| `useUserRoles`                                      | hook     | `GET .../provider/users/{id}/roles`                                     |
| `useRoleMembers`                                    | hook     | `GET .../provider/roles/{name}/members`                                 |
| `useAssignRole` / `useRemoveRole`                   | hook     | `PUT` / `DELETE .../users/{id}/roles/{name}` (idempotent)               |
| `useGroups`                                         | hook     | `GET .../provider/groups` — full (possibly nested) group tree           |
| `useUserGroups`                                     | hook     | `GET .../provider/users/{id}/groups`                                    |
| `useAddUserToGroup` / `useRemoveUserFromGroup`      | hook     | `PUT` / `DELETE .../users/{id}/groups/{groupId}`                        |
| `useUserSessions` / `useUserDevices`                | hook     | Admin view of another user's `sessions` / `devices`                     |
| `useTerminateSession`                               | hook     | `DELETE .../users/{id}/sessions/{sid}` (501 if unsupported)             |
| `useTerminateAllSessions`                           | hook     | `DELETE .../provider/users/{id}/sessions`                               |
| `useMyUserSessions` / `useMyUserDevices`            | hook     | The caller's OWN `GET /sessions` / `GET /devices`                       |
| `useRevokeMyUserSession`                            | hook     | `DELETE /sessions/{sid}` — revoke one of the caller's sessions          |
| `useRevokeMyOtherUserSessions`                      | hook     | `DELETE /sessions` — "log out everywhere else" (`revokedCount`)         |
| `useSessionReviewContext`                           | hook     | `GET /sessions/review?token=` — anonymous "Was this you?" context       |
| `useSubmitSessionReview`                            | hook     | `POST /sessions/review` — single-use Confirmed/Denied verdict           |
| `usePasswordChangedAt`                              | hook     | `GET .../provider/users/{id}/password/changed-at`                       |
| `useSendPasswordResetEmail`                         | hook     | `POST .../password/reset-email` (501 if unsupported)                    |
| `useSetTemporaryPassword`                           | hook     | `POST .../password/temporary` mutation                                  |
| `identityTranslationsEn` / `identityTranslationsFr` | const    | i18next bundles for the `identity` namespace                            |
| `IdentityConfig`                                    | type     | Provider input (client / three base paths / queryKeyPrefix)             |
| `IdentityProviderProps`                             | type     | `{ config, children }` — base paths optional, defaults applied          |
| `IdentityTranslations`                              | type     | Shape of the `identity` i18next resource bundle                         |
| `*Variables`                                        | type     | Per-mutation argument shapes (see note below)                           |

`*Variables` covers the mutation argument shapes re-exported alongside their hooks:
`UpdateUserVariables`, `SetUserEnabledVariables`, `RoleMutationVariables`,
`GroupMutationVariables`, `TerminateSessionVariables`, `SetTemporaryPasswordVariables`.

DTOs (`IdentityUser`, `IdentityRole`, `IdentityGroup`, `UserSessionResponse`,
`UserDeviceResponse`, `SessionReviewContextResponse`, …) are owned by
[`@granit/identity`](../identity); import them from there, not this package.

`./testing` subpath (requires the optional `msw`, `@granit/query-engine`, and
`@granit/react-query-engine` peers): `createIdentityHandlers(providerBase?,
cacheBase?, sessionsBase?)` — stateful MSW handlers covering the cache, provider,
role, group, session, password, self-service, and session-review surfaces — plus
`identityUserQueryMetadata` and the `mockUsers`, `mockSessions`, `mockDevices`,
`mockPasswordChangedAt` fixtures.

## Out of scope / caveats

- **Headless.** No tables, panels, or forms — those live in
  [`@granit/react-ui-identity`](../react-ui-identity). This package only adapts the
  core DTOs to React Query.
- **DTOs and HTTP transport** — owned by [`@granit/identity`](../identity) (mirror
  of `Granit.Identity`); hooks here never define wire shapes.
- **Provider-capability gating.** Capabilities (`supportsIndividualSessionTermination`,
  `supportsNativePasswordResetEmail`, `supportsGroupManagement`, …) vary by the
  backing IdP (e.g. Keycloak). `useTerminateSession` and `useSendPasswordResetEmail`
  surface a `501` when the active provider does not support the operation — gate the
  control on `useIdentityCapabilities()` rather than letting the call fail.
- **Three base paths, one provider.** `basePath` (cached users) is *not*
  `providerBasePath` (live IdP) is *not* `sessionsBasePath` (the caller's own
  sessions/devices, mounted at the API root). Self-service hooks (`useMy*`,
  `useRevokeMy*`) take no `userId`; the backend scopes to the authenticated caller.
- **Session review is anonymous.** `useSessionReviewContext` /
  `useSubmitSessionReview` back the token-protected "Was this you?" page reached from
  a security-alert email; the email token is the only credential and the page renders
  without an authenticated session. The context query is `retry: false` so an
  invalid/expired token surfaces its `400` immediately, and submission is single-use
  (a second verdict resolves with `applied: false`).
- **GDPR cache operations** (`useIdentityRgpd`) act on the local user *cache* only —
  `erase` hard-deletes and `pseudonymize` anonymizes cached PII. Enforcement and
  source-of-truth deletion remain the backend's responsibility.
- **i18n is the caller's job.** Register `identityTranslationsEn` /
  `identityTranslationsFr` under the `identity` namespace
  (`i18n.addResourceBundle('en', 'identity', identityTranslationsEn)`); components
  stay headless and take `labels` props apps populate from `t()`.

## License

Apache-2.0
