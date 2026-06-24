# @granit/subscriptions

Framework-agnostic **subscriptions** SDK — the TypeScript counterpart of the .NET
`Granit.Subscriptions` module (`granit-business/src/Granit.Subscriptions`, contract:
`contracts/openapi/subscriptions.json`). It covers the full billing surface: the
**plan catalog** (draft → publish → archive lifecycle), **price versioning**
(immutable price history with current-version tracking and bulk migration),
**subscription lifecycle** (create, change plan, migrate price, cancel), and
**seat management** (assign/revoke per-user seats).

This is the framework-agnostic **core** layer: it exposes the DTOs, branded id
types and Axios HTTP functions needed to drive subscriptions from any client —
React, React Native, a CLI, tests. It holds **no** React, DOM or Node-only
dependency. The React Query hooks/provider layer lives in
[`@granit/react-subscriptions`](../react-subscriptions); the admin feature kit
(plan and subscription list/detail pages) lives in
[`@granit/react-ui-subscriptions`](../react-ui-subscriptions).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. A consumer must declare these
peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/query-engine` — `getPage`, `PagedResult`, `QueryRequest` for the
  paginated `listSubscriptions` surface.
- `@granit/types` — `EntityId` / `ISODateString` branded base types.

## Quick start

Every function takes the `AxiosInstance` first and a `basePath` second (the module
collection root, e.g. `/api/v1/subscriptions`); the rest of the route is appended
internally.

```ts
import {
  listActivePlans,
  createSubscription,
  changeSubscriptionPlan,
  migrateSubscriptionPrice,
  assignSeat,
  cancelSubscription,
  type SubscriptionCreateRequest,
} from '@granit/subscriptions';

const basePath = '/api/v1/subscriptions';

// 1. Read the published plan catalog.
const plans = await listActivePlans(client, basePath); // PlanResponse[]

// 2. Subscribe a party to a plan (server picks the current price version).
const request: SubscriptionCreateRequest = {
  partyId,
  planId: plans[0]!.id,
  currency: 'EUR',
  trialEndsAt: null,
};
const sub = await createSubscription(client, basePath, request);

// 3. Move the subscription to a different plan, then a newer price version.
await changeSubscriptionPlan(client, basePath, sub.id, { newPlanId });
await migrateSubscriptionPrice(client, basePath, sub.id, { newPlanPriceId });

// 4. Seat-based plans: grant/revoke seats per user.
const seat = await assignSeat(client, basePath, sub.id, { userId });

// 5. Cancel — `atPeriodEnd` defers to the end of the current billing period.
await cancelSubscription(client, basePath, sub.id, {
  reason: 'Customer request',
  atPeriodEnd: true,
});
```

`listSubscriptions` is the only paginated read; it delegates to `getPage` from
`@granit/query-engine`, so page/pageSize/filters/sort are serialized consistently:

```ts
import { listSubscriptions } from '@granit/subscriptions';

const page = await listSubscriptions(client, basePath, {
  page: 1,
  pageSize: 20,
}); // PagedResult<SubscriptionResponse>
```

## Public API

| Symbol                                          | Kind  | Purpose                                                                         |
| ----------------------------------------------- | ----- | ------------------------------------------------------------------------------- |
| `PlanId` / `PlanPriceId` / `SubscriptionId`     | type  | `EntityId`-branded identifiers                                                  |
| `PricingModel`                                  | type  | `Flat \| PerSeat \| PerUnit \| Tiered`                                          |
| `BillingInterval`                               | type  | `Monthly \| Quarterly \| Yearly`                                                |
| `PlanLifecycleStatus`                           | type  | `Draft \| PendingReview \| Published \| Archived`                               |
| `SubscriptionStatus`                            | type  | `Trial \| Active \| PastDue \| Suspended \| Cancelled \| Expired`               |
| `Plan*Request` / `PlanResponse`                 | type  | Plan create/update bodies and the catalog response shape                        |
| `CreatePriceVersionRequest`                     | type  | `POST .../plans/{planId}/prices` body                                           |
| `PlanPriceResponse`                             | type  | One price version (effective range, `isCurrent`, replacement)                   |
| `Subscription*Request` / `SubscriptionResponse` | type  | Subscription create/cancel/change-plan + response                               |
| `Migrate*Request` / `BulkMigratePrice*`         | type  | Single and bulk price-migration bodies/result                                   |
| `Seat*Request` / `SeatResponse`                 | type  | Seat assignment body and per-user seat response                                 |
| `SubscriptionsPermissions`                      | const | Permission registry: `Plans`/`Subscriptions`/`Prices`/`Seats` x `Read`/`Manage` |
| `listActivePlans`                               | fn    | `GET {basePath}/plans/active` — published catalog                               |
| `getPlanById`                                   | fn    | `GET {basePath}/plans/{id}`                                                     |
| `createPlan` / `updatePlan`                     | fn    | `POST` / `PUT {basePath}/plans[/{id}]`                                          |
| `publishPlan` / `archivePlan`                   | fn    | `POST {basePath}/plans/{id}/publish` \| `/archive`                              |
| `createPriceVersion`                            | fn    | `POST {basePath}/plans/{planId}/prices`                                         |
| `getPlanPriceHistory`                           | fn    | `GET {basePath}/plans/{planId}/prices/history` (currency+interval)              |
| `listSubscriptions`                             | fn    | `GET {basePath}/subscriptions` — paginated via `getPage`                        |
| `getActiveSubscription`                         | fn    | `GET {basePath}/subscriptions/active`                                           |
| `getSubscriptionById`                           | fn    | `GET {basePath}/subscriptions/{id}`                                             |
| `createSubscription`                            | fn    | `POST {basePath}/subscriptions`                                                 |
| `cancelSubscription`                            | fn    | `POST {basePath}/subscriptions/{id}/cancel`                                     |
| `changeSubscriptionPlan`                        | fn    | `POST {basePath}/subscriptions/{id}/change-plan`                                |
| `migrateSubscriptionPrice`                      | fn    | `POST {basePath}/subscriptions/{id}/migrate-price`                              |
| `bulkMigrateSubscriptionPrice`                  | fn    | `POST {basePath}/subscriptions/bulk-migrate-price`                              |
| `listSeats`                                     | fn    | `GET {basePath}/subscriptions/{id}/seats`                                       |
| `assignSeat` / `revokeSeat`                     | fn    | `POST` \| `DELETE {basePath}/subscriptions/{id}/seats[/{userId}]`               |

## Caveats

- **`SubscriptionsPermissions` is a UX hint, not enforcement.** The registry mirrors
  the backend permission names so apps can gate controls; every endpoint re-checks
  authorization server-side. Never treat a client-side check as a security boundary.
- **Price versions are immutable.** `createPriceVersion` appends a new version and
  flips `isCurrent`; existing prices are never edited. Use `getPlanPriceHistory`
  (filtered by `currency` + `interval`) to read the lineage and
  `migrateSubscriptionPrice` / `bulkMigrateSubscriptionPrice` to move subscribers
  onto a newer version.
- **`required` ≠ nullability.** TS optionality (`?`) reflects the OpenAPI `required`
  array, independent of nullable values. `SubscriptionResponse.modifiedAt` is
  required-but-nullable (`ISODateString | null`); coalesce `?? createdAt`. Optional
  request fields like `trialDays?`, `seatLimit?`, `atPeriodEnd?` are C#-defaulted
  params, absent from `required`.
- **Timestamps are branded.** All instant fields are `ISODateString`, not plain
  `string`; wrap literals with `toISODateString()` from `@granit/types`.

## Out of scope

- **React bindings** — TanStack Query hooks, the `SubscriptionsProvider`, query-key
  factory and MSW testing fixtures live in
  [`@granit/react-subscriptions`](../react-subscriptions); this package is headless.
- **Rendering** — plan/subscription list and detail pages and locales live in
  [`@granit/react-ui-subscriptions`](../react-ui-subscriptions).
- **Invoicing / payments / dunning** — billing-document generation, payment capture
  and past-due recovery are separate backend modules and `@granit/*` packages
  (`@granit/invoicing`, `@granit/payments`); this package owns only the plan,
  subscription, price-version and seat contracts.

## License

Apache-2.0
