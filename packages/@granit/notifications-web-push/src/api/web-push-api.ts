import { buildApiUrl } from '@granit/api-client';

import type { AxiosInstance } from 'axios';

export async function registerPushSubscription(
  client: AxiosInstance,
  basePath: string,
  subscription: PushSubscriptionJSON
): Promise<void> {
  await client.post(buildApiUrl(basePath, 'notifications', 'push-subscriptions'), subscription);
}

export async function unregisterPushSubscription(
  client: AxiosInstance,
  basePath: string,
  endpoint: string
): Promise<void> {
  await client.delete(buildApiUrl(basePath, 'notifications', 'push-subscriptions'), {
    data: { endpoint },
  });
}
