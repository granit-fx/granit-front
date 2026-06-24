# @granit/react-subscriptions

React hooks + provider for the Granit **subscriptions** module — plan catalogue,
subscription lifecycle, price versioning, and per-subscription seat management.
This is the **React hooks layer**: it wraps the framework-agnostic Axios calls and
DTOs from [`@granit/subscriptions`](../subscriptions) in TanStack Query hooks behind
a shared `SubscriptionsProvider` for client/base-path/query-key configuration. It
holds no rendering — list pages, detail views, and dialogs live one layer up.

The split is three packages over the same `Granit.Subscriptions` backend in
`granit-business` (contract: `contracts/openapi/subscriptions.json`):

- [`@granit/subscriptions`](../subscriptions) — framework-agnostic core: DTOs,
  branded ids, permissions, and Axios functions (`listActivePlans`,
  `createSubscription`, `assignSeat`, …).
- `@granit/react-subscriptions` (this package) — React Query hooks + provider.
- [`@granit/react-ui-subscriptions`](../react-ui-subscriptions) — admin UI kit:
  the plan catalogue and subscription list/detail pages, price-history and
  seat-assignment views, publish/archive/migrate dialogs.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/subscriptions` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/types` — shared branded ids (`toEntityId`, `CurrencyCode`,
  `ISODateString`).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `@granit/query-engine` / `@granit/react-query-engine` (**optional**) — only for
  the paginated `useSubscriptions` surface and the `./testing` query metadata.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-subscriptions/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { SubscriptionsProvider, useActivePlans } from '@granit/react-subscriptions';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <SubscriptionsProvider config={{ client: useGranitClient() }}>
      {children}
    </SubscriptionsProvider>
  );
}

function PlanPicker() {
  const { data: plans, isLoading } = useActivePlans();
  if (isLoading) return null;
  return (
    <ul>
      {plans?.map((plan) => <li key={plan.id}>{plan.name}</li>)}
    </ul>
  );
}
```

Mutations invalidate the relevant query branch on success. Lifecycle actions
(`publish` / `archive`) and price/seat changes follow the same pattern:

```tsx
import {
  useCreateSubscription,
  usePublishPlan,
  useAssignSeat,
} from '@granit/react-subscriptions';

function Actions({ planId, subscriptionId }: { planId: string; subscriptionId: string }) {
  const publish = usePublishPlan();
  const create = useCreateSubscription();
  const assign = useAssignSeat(subscriptionId);

  return (
    <>
      <button onClick={() => publish.mutate({ id: planId })}>Publish plan</button>
      <button
        onClick={() =>
          create.mutate({ partyId: 'party-1', planId, currency: 'EUR', trialEndsAt: null })
        }
      >
        Subscribe
      </button>
      <button onClick={() => assign.mutate({ userId: 'user-1' })}>Assign seat</button>
    </>
  );
}
```

`useSubscriptions(params?)` takes a `QueryRequest` and returns a paginated
`PagedResult<SubscriptionResponse>` (`{ items, totalCount }`) with
`keepPreviousData` for smooth paging. Read hooks keyed by an id
(`usePlan`, `useSubscription`, `useSeats`, `usePlanPriceHistory`) auto-disable
while the id is empty.

## Public API

| Symbol                            | Kind     | Purpose                                                                  |
| --------------------------------- | -------- | ------------------------------------------------------------------------ |
| `SubscriptionsProvider`           | provider | Supplies client, base path, query-key prefix to all hooks below it       |
| `useSubscriptionsConfig`          | hook     | Read the resolved config; throws outside a provider                      |
| `buildSubscriptionsQueryKey`      | fn       | Query-key factory honoring the configured `queryKeyPrefix`               |
| `useActivePlans`                  | hook     | `GET .../plans/active` — published plans                                 |
| `usePlan`                         | hook     | `GET .../plans/{id}` — single plan (disabled when `id` empty)            |
| `usePlanPriceHistory`             | hook     | `GET .../plans/{id}/prices/history` filtered by currency + interval      |
| `useCreatePlan`                   | hook     | `POST .../plans` mutation; invalidates plan queries                      |
| `useUpdatePlan`                   | hook     | `PUT .../plans/{id}` mutation; invalidates plan queries                  |
| `usePublishPlan`                  | hook     | `POST .../plans/{id}/publish` — draft → published                        |
| `useArchivePlan`                  | hook     | `POST .../plans/{id}/archive` — block new subscriptions                  |
| `useCreatePriceVersion`           | hook     | `POST .../plans/{id}/prices` — new price version                         |
| `useSubscriptions`                | hook     | `GET .../subscriptions` — paginated `PagedResult` discovery surface      |
| `useActiveSubscription`           | hook     | `GET .../subscriptions/active` — the caller's active subscription        |
| `useSubscription`                 | hook     | `GET .../subscriptions/{id}` (disabled when `id` empty)                  |
| `useCreateSubscription`           | hook     | `POST .../subscriptions` mutation                                        |
| `useCancelSubscription`           | hook     | `POST .../subscriptions/{id}/cancel` mutation                            |
| `useChangeSubscriptionPlan`       | hook     | `POST .../subscriptions/{id}/change-plan` mutation                       |
| `useMigrateSubscriptionPrice`     | hook     | `POST .../subscriptions/{id}/migrate-price` — to a new price version     |
| `useBulkMigrateSubscriptionPrice` | hook     | `POST .../subscriptions/bulk-migrate-price` — migrate many at once       |
| `useSeats`                        | hook     | `GET .../subscriptions/{id}/seats` (disabled when `id` empty)            |
| `useAssignSeat`                   | hook     | `POST .../subscriptions/{id}/seats` mutation (bound to a subscription)   |
| `useRevokeSeat`                   | hook     | `DELETE .../subscriptions/{id}/seats/{userId}` mutation                  |
| `SubscriptionsConfig`             | type     | Provider input (optional `client` / `basePath` / `queryKeyPrefix`)       |
| `ResolvedSubscriptionsConfig`     | type     | Provider output with the resolved required client + basePath             |
| `SubscriptionsProviderProps`      | type     | `{ config, children }`                                                   |
| `*Variables`                      | type     | Per-mutation argument shapes (e.g. `CreatePlanVariables`)                |

`./testing` subpath (requires the optional `msw`, `@granit/query-engine`, and
`@granit/react-query-engine` peers): `createSubscriptionsHandlers` (stateful MSW
handlers covering plans, price versions, subscriptions, and seats — all mutations
persist in-memory; default base `/api/v1/subscriptions`), the `planQueryMetadata`
and `subscriptionQueryMetadata` `/meta` payloads, and the `mockPlans`,
`mockPriceHistory`, `mockSubscriptions`, `mockSeats` fixtures.

## Out of scope

- **Rendering** — plan/subscription pages, price-history and seat-assignment views,
  and the publish/archive/migrate dialogs live in
  [`@granit/react-ui-subscriptions`](../react-ui-subscriptions). This package is
  headless.
- **DTOs, branded ids, and HTTP transport** — owned by
  [`@granit/subscriptions`](../subscriptions) (mirror of `Granit.Subscriptions`);
  hooks here only adapt those calls to React Query. The `Variables` aliases are
  for ergonomics; the wire shapes are the core `*Request` / `*Response` DTOs.
- **Permission checks** — `SubscriptionsPermissions` constants ship in the core
  package; gate controls with `@granit/react-authorization`. Client-side checks are
  a UX hint, never a security boundary — the backend re-authorizes every call.
- **Billing/payment execution** — invoicing, dunning, and payment capture are
  backend (`Granit.Subscriptions`) concerns; this layer only drives the lifecycle
  and price-versioning APIs.

## License

Apache-2.0
