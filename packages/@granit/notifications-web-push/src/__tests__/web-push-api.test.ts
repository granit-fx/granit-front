import { createMockClient } from '@granit/testing';
import { describe, expect, it } from 'vitest';

import { registerPushSubscription, unregisterPushSubscription } from '../api/web-push-api';

describe('web-push-api', () => {
  it('should register a push subscription', async () => {
    const client = createMockClient();
    const subscription = {
      endpoint: 'https://push.example.com/sub/123',
      keys: { p256dh: 'key', auth: 'auth' },
    };

    await registerPushSubscription(client, '/api/v1', subscription);

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/notifications/web-push/subscriptions',
      subscription
    );
  });

  it('should unregister a push subscription', async () => {
    const client = createMockClient();
    const endpoint = 'https://push.example.com/sub/123';

    await unregisterPushSubscription(client, '/api/v1', endpoint);

    expect(client.delete).toHaveBeenCalledWith('/api/v1/notifications/web-push/subscriptions', {
      data: { endpoint },
    });
  });
});
