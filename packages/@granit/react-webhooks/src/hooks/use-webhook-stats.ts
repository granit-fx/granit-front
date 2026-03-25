import { getStats, webhooksKeys } from '@granit/webhooks';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_WEBHOOKS_BASE_PATH } from '../constants.js';

import type { WebhooksOptions } from './use-subscription.js';
import type { WebhookSubscriptionStatsResponse } from '@granit/webhooks';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches aggregated webhook statistics.
 */
export function useWebhookStats(
  options: WebhooksOptions
): UseQueryResult<WebhookSubscriptionStatsResponse> {
  const { client, basePath = DEFAULT_WEBHOOKS_BASE_PATH } = options;

  return useQuery({
    queryKey: webhooksKeys.stats(),
    queryFn: () => getStats(client, basePath),
  });
}
