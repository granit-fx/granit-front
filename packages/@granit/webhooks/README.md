# @granit/webhooks

Webhook subscription management -- CRUD, lifecycle (activate/suspend/deactivate), secret rotation, test ping, delivery tracking, stats. Mirrors `Granit.Webhooks` .NET contract.

## Installation

```bash
pnpm add @granit/webhooks
```

## API

### Types

- `WebhookSubscriptionResponse`, `WebhookSubscriptionCreateRequest`, `WebhookSubscriptionUpdateRequest` -- subscription CRUD
- `WebhookSubscriptionStatus`, `WebhookSubscriptionStatusValue` -- status enum
- `WebhookSubscriptionDeactivateRequest` -- deactivation
- `WebhookSubscriptionRotateSecretResponse` -- secret rotation
- `WebhookSubscriptionTestPingResponse` -- test ping
- `WebhookSubscriptionStatsResponse` -- statistics
- `WebhookDeliveryAttemptResponse` -- delivery tracking
- `WebhookEventTypeResponse` -- event types
- `WebhookSigningKeyResponse`, `WebhookSigningKeyCreatedResponse` -- signing keys
- `WebhookModuleConfigResponse` -- module configuration

### Functions

- `getSubscription(...)`, `createSubscription(...)`, `updateSubscription(...)`, `deleteSubscription(...)` -- CRUD
- `activateSubscription(...)`, `suspendSubscription(...)`, `deactivateSubscription(...)` -- lifecycle
- `listSigningKeys(...)`, `rotateSigningKey(...)`, `revokeSigningKey(...)` -- signing-key rotation
- `testPing(...)` -- send test ping
- `retryDelivery(...)` -- retry a failed delivery (the delivery list is queried
  generically via `@granit/react-query-engine` against `{basePath}/deliveries`)
- `getEventTypes(...)`, `getConfig(...)`, `getStats(...)` -- configuration and stats

## Usage

```ts
import { createSubscription, testPing } from '@granit/webhooks';

const subscription = await createSubscription(client, basePath, {
  url: 'https://example.com/webhook',
  events: ['order.created', 'order.updated'],
});
await testPing(client, basePath, subscription.id);
```

## License

Apache-2.0
