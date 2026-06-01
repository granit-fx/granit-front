import { getDeliveries } from '@granit/webhooks';
import { useQuery } from '@tanstack/react-query';

import { useWebhooksConfig } from '../providers/webhooks-provider';

import { webhooksKeys } from './query-keys';

import type { WebhookDeliveryAttemptResponse } from '@granit/webhooks';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches delivery attempts for a specific subscription.
 *
 * The query is disabled when `subscriptionId` is empty.
 */
export function useDeliveries(
  subscriptionId: string
): UseQueryResult<WebhookDeliveryAttemptResponse[]> {
  const { client, basePath } = useWebhooksConfig();

  return useQuery({
    queryKey: webhooksKeys.deliveries(subscriptionId),
    queryFn: () => getDeliveries(client, basePath, { subscriptionId }),
    enabled: subscriptionId.length > 0,
  });
}
