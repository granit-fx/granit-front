import { buildApiUrl } from '@granit/api-client';

import type {
  WebPushSubscriptionRegisterRequest,
  WebPushSubscriptionRemoveRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

export async function registerPushSubscription(
  client: AxiosInstance,
  basePath: string,
  subscription: WebPushSubscriptionRegisterRequest
): Promise<void> {
  await client.post(buildApiUrl(basePath, 'notifications', 'push', 'subscriptions'), subscription);
}

export async function unregisterPushSubscription(
  client: AxiosInstance,
  basePath: string,
  endpoint: string
): Promise<void> {
  const body: WebPushSubscriptionRemoveRequest = { endpoint };
  await client.delete(buildApiUrl(basePath, 'notifications', 'push', 'subscriptions'), {
    data: body,
  });
}
