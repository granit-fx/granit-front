import { getStats } from '@granit/webhooks';
import { useQuery } from '@tanstack/react-query';

import { useWebhooksConfig } from '../providers/webhooks-provider';

import { webhooksKeys } from './query-keys';

import type { WebhookSubscriptionStatsResponse } from '@granit/webhooks';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches aggregated webhook statistics.
 */
export function useWebhookStats(): UseQueryResult<WebhookSubscriptionStatsResponse> {
  const { client, basePath } = useWebhooksConfig();

  return useQuery({
    queryKey: webhooksKeys.stats(),
    queryFn: () => getStats(client, basePath),
  });
}
