import { getSubscription } from '@granit/webhooks';
import { useQuery } from '@tanstack/react-query';

import { useWebhooksConfig } from '../providers/webhooks-provider';

import { webhooksKeys } from './query-keys';

import type { WebhookSubscriptionResponse } from '@granit/webhooks';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches a single webhook subscription by ID.
 *
 * The query is disabled when `id` is empty.
 */
export function useSubscription(id: string): UseQueryResult<WebhookSubscriptionResponse> {
  const { client, basePath } = useWebhooksConfig();

  return useQuery({
    queryKey: webhooksKeys.subscription(id),
    queryFn: () => getSubscription(client, `${basePath}/subscriptions`, id),
    enabled: id.length > 0,
  });
}
