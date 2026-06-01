import { getEventTypes } from '@granit/webhooks';
import { useQuery } from '@tanstack/react-query';

import { useWebhooksConfig } from '../providers/webhooks-provider';

import { webhooksKeys } from './query-keys';

import type { WebhookEventTypeResponse } from '@granit/webhooks';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches all registered webhook event types.
 *
 * The data is immutable at runtime (only changes on application restart),
 * so an aggressive staleTime is used.
 */
export function useEventTypes(): UseQueryResult<WebhookEventTypeResponse[]> {
  const { client, basePath } = useWebhooksConfig();

  return useQuery({
    queryKey: [...webhooksKeys.all, 'event-types'],
    queryFn: () => getEventTypes(client, basePath),
    staleTime: Infinity,
  });
}
