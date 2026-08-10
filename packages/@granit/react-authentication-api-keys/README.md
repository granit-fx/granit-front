# @granit/react-authentication-api-keys

React Query data layer for the **Authentication API keys** module — the headless
hooks (queries + mutations) that drive the api-key lifecycle from a React app. It
wraps the framework-agnostic HTTP client from
[`@granit/authentication-api-keys`](../authentication-api-keys) in TanStack Query
hooks, wiring cache keys, cancellation, `keepPreviousData` paging and automatic
list/detail invalidation on mutation.

This is the **React hooks** layer of a three-tier split, all backed by the .NET
`Granit.Authentication.ApiKeys` module (`contracts/openapi/api-keys.json`,
`/authentication/api-keys`):

- [`@granit/authentication-api-keys`](../authentication-api-keys) — framework-agnostic
  core: wire DTOs, the Axios calls, permission constants, validation constraints.
- `@granit/react-authentication-api-keys` (this package) — React Query hooks and
  query-key factory. No provider: the host passes its `AxiosInstance` per call.
- [`@granit/react-ui-authentication-api-keys`](../react-ui-authentication-api-keys) —
  ready-made admin feature kit (list grid, create form, detail/scopes page) that
  consumes these hooks.

Hooks take their Axios client and base path through an `ApiKeyHookOptions`
argument rather than a context provider, so a host that already owns a
`GranitClientProvider` resolves the client itself and forwards `{ client }`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers:

- `@granit/authentication-api-keys` — the core SDK (DTOs + Axios calls) this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors).
- `@granit/query-engine` — the grid grammar and `QueryMetadata` shape for the list hook.
- `@tanstack/react-query` (`^5`) — the query/mutation runtime.
- `react` (`^19`).
- `msw` (`^2`, optional) — only needed to pull the `./testing` MSW handlers.

## Quick start

```tsx
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from '@granit/react-authentication-api-keys';
import { ApiKeyQuickFilters } from '@granit/authentication-api-keys';
import { useGranitClient } from '@granit/react-api-client';

function ApiKeyManager() {
  const client = useGranitClient();

  // Paginated, filterable list. By default only active (non-revoked) keys.
  const { data, isLoading } = useApiKeys(
    { client },
    {
      search: 'sync',
      quickFilters: [ApiKeyQuickFilters.IncludeRevoked],
      sort: [{ field: 'createdAt', direction: 'desc' }],
    },
    { staleTime: 60_000 }
  );

  const create = useCreateApiKey({ client });
  const revoke = useRevokeApiKey({ client });

  if (isLoading) return <p>Loading…</p>;

  return (
    <ul>
      {data?.items.map((key) => (
        <li key={key.id}>
          {key.name} ({key.prefix}…{key.lastFourChars})
          <button onClick={() => revoke.mutate(key.id)}>Revoke</button>
        </li>
      ))}
      <li>
        <button
          onClick={async () => {
            const { rawSecret } = await create.mutateAsync({
              name: 'My key',
              type: 'Secret',
              environment: 'production',
            });
            // Show `rawSecret` once — it is never returned again.
          }}
        >
          Create
        </button>
      </li>
    </ul>
  );
}
```

Every hook accepts an `ApiKeyHookOptions` (`{ client, basePath?, queryKeyPrefix? }`).
`basePath` defaults to `/api/v1/authentication`; the list hook then targets
`{basePath}/api-keys`. Mutations invalidate the list (and the affected key's
detail) on success, so a wired `useApiKeys` refreshes automatically.

## Public API

| Symbol                        | Kind | Purpose                                                                                         |
| ----------------------------- | ---- | ----------------------------------------------------------------------------------------------- |
| `useApiKeys`                  | hook | Paginated, filterable list (`GET {basePath}/api-keys`), QueryEngine grammar, `keepPreviousData` |
| `useApiKeysQueryMeta`         | hook | Grid metadata (`GET {basePath}/api-keys/meta`) — columns, filters, quick filters, defaults      |
| `useApiKey`                   | hook | Single key by id (`GET {basePath}/{id}`); disabled when `id` is empty                           |
| `useCreateApiKey`             | hook | Create (`POST {basePath}`); returns the one-time `rawSecret`; invalidates list                  |
| `useRevokeApiKey`             | hook | Revoke (`POST {basePath}/{id}/revoke`); invalidates list + detail                               |
| `useRotateApiKey`             | hook | Rotate secret (`POST {basePath}/{id}/rotate`); new `rawSecret`; invalidates list + detail       |
| `useUpdateApiKeyScopes`       | hook | Update permissions + allowed CIDRs (`PUT {basePath}/{id}/scopes`); invalidates list + detail    |
| `buildApiKeyQueryKey`         | fn   | React Query key factory (`queryKeyPrefix` aware, defaults to `['api-keys']`)                    |
| `ApiKeyHookOptions`           | type | `{ client, basePath?, queryKeyPrefix? }` accepted by every hook                                 |
| `ApiKeyQueryOptions`          | type | Overridable TanStack Query options (`staleTime`, `enabled`, `refetchInterval`, …)               |
| `UseApiKeysParams`            | type | List query params — alias of the core `ListApiKeysParams` (QueryEngine grammar)                 |
| `UpdateApiKeyScopesVariables` | type | `{ id, request }` variables for the update-scopes mutation                                      |

Domain types and constants (`ApiKeyResponse`, `ApiKeyType`, `ApiKeyQuickFilters`,
…) are not re-exported here — import them from the core
[`@granit/authentication-api-keys`](../authentication-api-keys).

### Testing subpath

`@granit/react-authentication-api-keys/testing` ships fixtures for consumer tests
(requires the optional `msw` peer):

- `mockApiKeys` — five representative `ApiKeyResponse` fixtures (active, revoked,
  every `ApiKeyType` and `cacheBehavior`).
- `createApiKeyHandlers(baseUrl?)` — stateful MSW handlers mirroring
  `Granit.Authentication.ApiKeys.Endpoints`: QueryEngine-backed list + `/meta`,
  detail, create, revoke, rotate, scopes. Revoked keys are hidden unless
  `quickFilters=includeRevoked`.

## Caveats

- **The raw secret is shown once.** `useCreateApiKey` and `useRotateApiKey`
  return `rawSecret` only in the mutation result — it is never persisted server-side
  or returned by any query. Surface it immediately and do not log it.
- **List rows are summaries.** `useApiKeys` returns `ApiKeyListItemResponse` rows
  without `permissions` / `allowedCidrs`; load those for a selected key via
  `useApiKey` before editing scopes.
- **No provider, no context.** Pass `{ client }` explicitly. There is no internal
  Axios singleton; the host owns the `AxiosInstance` and its interceptors.
- **Client-side gating is a UX hint, not enforcement.** The backend re-checks the
  `ApiKeyPermissions` on every endpoint; hiding a control here does not stop the
  underlying API call.

## License

Apache-2.0
