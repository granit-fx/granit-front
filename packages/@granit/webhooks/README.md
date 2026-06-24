# @granit/webhooks

Webhook subscription management SDK — the framework-level TypeScript counterpart
of the .NET `Granit.Webhooks` module (contract:
`contracts/openapi/webhooks.json`). Covers subscription CRUD, the lifecycle
transitions (activate / suspend / deactivate), overlapping signing-key rotation,
test pings, the event-type catalog, module config, aggregated stats, and the
delivery audit trail.

This is the framework-agnostic **core** layer: it exposes the DTOs, the Axios
HTTP functions, and the permission constants needed to drive the webhooks
backend from any client — React, React Native, a CLI, tests. It holds **no**
React, DOM or Node-only dependency. The split is three packages over the same
`Granit.Webhooks` backend:

- `@granit/webhooks` (this package) — framework-agnostic core: DTOs + Axios
  functions (`createSubscription`, `rotateSigningKey`, `getStats`, …) +
  `WebhooksPermissions`.
- [`@granit/react-webhooks`](../react-webhooks) — TanStack Query hooks +
  `WebhooksProvider` (client / base-path / query-key config) + query-key factory.
- [`@granit/react-ui-webhooks`](../react-ui-webhooks) — admin UI feature kit:
  list / detail / create pages, dashboard, subscription + delivery tables,
  status badges, signing-key panel, secret display, and i18n bundles.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare the single peer:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.

## Quick start

Every function takes the resolved `AxiosInstance` plus a `basePath`. The
subscriptions collection root (e.g. `/api/v1/webhooks/subscriptions`) is the
`basePath` for CRUD, lifecycle, signing-key, and test-ping calls; the webhooks
module root (e.g. `/api/v1/webhooks`) is the `basePath` for `getEventTypes`,
`getConfig`, and `retryDelivery`.

```ts
import {
  createSubscription,
  rotateSigningKey,
  testPing,
  WebhooksPermissions,
} from '@granit/webhooks';
import { useGranitClient } from '@granit/react-api-client';

const client = useGranitClient();
const basePath = '/api/v1/webhooks/subscriptions';

// 1. Create — the plaintext `signingSecret` is returned exactly once (201).
const created = await createSubscription(client, basePath, {
  targetUrl: 'https://example.com/webhook',
  eventType: 'order.created',
});
// created.signingSecret — store it now; later reads only return a masked hint.

// 2. Verify reachability with a synchronous test ping.
const ping = await testPing(client, basePath, created.id);
// ping.success / ping.httpStatusCode / ping.durationMs

// 3. Rotate the signing key — the previous Active key moves to Retired for a
//    grace period (both verify); the new `plainSecret` is disclosed once.
const rotated = await rotateSigningKey(client, basePath, created.id);

// Gate the management surface on the backend permission name.
const canManage = WebhooksPermissions.Subscriptions.Manage; // 'Webhooks.Subscriptions.Manage'
```

The delivery list (`GET {moduleRoot}/deliveries`) and its `/meta` are served by
the Granit query engine and consumed generically via
[`@granit/react-query-engine`](../react-query-engine) — there is no dedicated
list function here. Filter by subscription with `filter[subscriptionId.Eq]=…`;
`retryDelivery` re-queues a single failed attempt.

## Public API

| Symbol                                 | Kind  | Purpose                                                        |
| -------------------------------------- | ----- | -------------------------------------------------------------- |
| `WebhookSubscriptionStatus`            | const | `Active \| Suspended \| Deactivated` enum (value + type)       |
| `WebhookSigningKeyStatus`              | const | `Active \| Retired \| Revoked` enum (value + type)             |
| `WebhookSubscriptionId`                | type  | Branded subscription id (`EntityId<'WebhookSubscription'>`)    |
| `WebhookDeliveryId`                    | type  | Branded delivery id                                            |
| `WebhookSigningKeyId`                  | type  | Branded signing-key id                                         |
| `WebhookSubscriptionCreateRequest`     | type  | `POST {basePath}` body (`targetUrl`, `eventType`)              |
| `WebhookSubscriptionUpdateRequest`     | type  | `PUT {basePath}/{id}` body (`targetUrl`)                       |
| `WebhookSubscriptionDeactivateRequest` | type  | `POST {basePath}/{id}/deactivate` body (`reason`)              |
| `WebhookSubscriptionResponse`          | type  | Subscription descriptor (status, failures, masked secret hint) |
| `WebhookSubscriptionCreatedResponse`   | type  | `201` body — carries the one-time `signingSecret`              |
| `WebhookSubscriptionTestPingResponse`  | type  | Synchronous test-ping result (`success`, status, duration)     |
| `WebhookSubscriptionStatsResponse`     | type  | Aggregated module stats (counts, 24h delivery metrics)         |
| `WebhookSigningKeyResponse`            | type  | Read-only signing-key projection (no secret)                   |
| `WebhookSigningKeyCreatedResponse`     | type  | Rotation `201` body — carries the one-time `plainSecret`       |
| `WebhookEventTypeResponse`             | type  | Registered event-type descriptor (category-sorted)             |
| `WebhookModuleConfigResponse`          | type  | `GET {moduleRoot}/config` body (`storePayload`)                |
| `WebhookDeliveryAttemptResponse`       | type  | Immutable delivery audit record (payload hash, optional body)  |
| `getSubscription`                      | fn    | `GET {basePath}/{id}`                                          |
| `createSubscription`                   | fn    | `POST {basePath}` — returns the one-time signing secret        |
| `updateSubscription`                   | fn    | `PUT {basePath}/{id}` — change the target URL                  |
| `deleteSubscription`                   | fn    | `DELETE {basePath}/{id}`                                       |
| `activateSubscription`                 | fn    | `POST {basePath}/{id}/activate`                                |
| `suspendSubscription`                  | fn    | `POST {basePath}/{id}/suspend`                                 |
| `deactivateSubscription`               | fn    | `POST {basePath}/{id}/deactivate` (requires `reason`)          |
| `listSigningKeys`                      | fn    | `GET {basePath}/{id}/keys`                                     |
| `rotateSigningKey`                     | fn    | `POST {basePath}/{id}/keys` — returns the one-time plaintext   |
| `revokeSigningKey`                     | fn    | `DELETE {basePath}/{id}/keys/{keyId}`                          |
| `testPing`                             | fn    | `POST {basePath}/{id}/test-ping`                               |
| `getEventTypes`                        | fn    | `GET {moduleRoot}/event-types`                                 |
| `getConfig`                            | fn    | `GET {moduleRoot}/config`                                      |
| `getStats`                             | fn    | `GET {basePath}/stats`                                         |
| `retryDelivery`                        | fn    | `POST {moduleRoot}/deliveries/{deliveryId}/retry`              |
| `WebhooksPermissions`                  | const | Backend permission names (`Subscriptions.Read` / `.Manage`)    |

## Caveats

- **Secrets are returned once.** `createSubscription` (`signingSecret`) and
  `rotateSigningKey` (`plainSecret`) disclose the plaintext exactly once, at
  creation/rotation time. Subsequent reads expose only the Stripe-style masked
  `signingSecretHint` on `WebhookSubscriptionResponse` (`null` for legacy
  subscriptions predating the hint — fall back to a static placeholder). Never
  log or persist the plaintext beyond the user's secure copy step.
- **Overlapping key rotation.** Rotation moves the previous `Active` key to
  `Retired` for a grace period during which **both** keys verify; only then can
  the retired key be revoked. The last `Active` key cannot be revoked — rotate
  first to introduce a new `Active` key, then revoke the old one.
- **Two distinct base paths.** Subscription-scoped calls use the subscriptions
  collection root; `getEventTypes`, `getConfig`, and `retryDelivery` use the
  webhooks module root. Passing the wrong one yields a 404.
- **Stored payloads are opt-in.** `WebhookDeliveryAttemptResponse.payload` is
  `null` unless the backend `WebhooksOptions.StorePayload` is enabled (default
  off); `payloadHash` is always present for audit correlation.

## Out of scope

- **React hooks / provider / query keys** — owned by
  [`@granit/react-webhooks`](../react-webhooks); this package is headless.
- **Rendering** — pages, tables, badges, the secret-display and signing-key
  panels, and i18n bundles live in
  [`@granit/react-ui-webhooks`](../react-ui-webhooks).
- **Delivery list querying** — served by the query engine and consumed via
  [`@granit/react-query-engine`](../react-query-engine); this package only
  exposes the single-attempt `retryDelivery` mutation and the
  `WebhookDeliveryAttemptResponse` shape.

## License

Apache-2.0
