# @granit/react-webhooks

React hooks for `@granit/webhooks` -- subscription CRUD, lifecycle, secret rotation, test ping, delivery tracking.

## Installation

```bash
pnpm add @granit/react-webhooks
```

## API

### Hooks

- `useSubscription(id, options?)` -- fetch a webhook subscription
- `useCreateSubscription()`, `useUpdateSubscription()`, `useDeleteSubscription()` -- subscription CRUD
- `useActivateSubscription()`, `useSuspendSubscription()`, `useDeactivateSubscription()` -- lifecycle
- `useRotateSecret()` -- rotate subscription secret
- `useTestPing()` -- send a test ping
- `useDeliveries(subscriptionId)` -- list delivery attempts
- `useRetryDelivery(options?)` -- retry a failed delivery
- `useEventTypes(options?)` -- list available event types
- `useWebhookConfig(options?)` -- fetch module configuration
- `useWebhookStats(subscriptionId)` -- fetch subscription statistics

## Usage

```tsx
import { useSubscription, useTestPing } from '@granit/react-webhooks';

function WebhookDetail({ id }: { id: string }) {
  const { data: subscription } = useSubscription(id);
  const { mutate: testPing } = useTestPing();

  return (
    <div>
      <h2>{subscription?.url}</h2>
      <button onClick={() => testPing(id)}>Send test ping</button>
    </div>
  );
}
```

## License

Apache-2.0
