import { getEventTypes, webhooksKeys } from '@granit/webhooks';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_WEBHOOKS_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { WebhookEventTypeResponse } from '@granit/webhooks';
import type { UseQueryResult } from '@tanstack/react-query';

export interface EventTypesOptions {
  readonly client: AxiosInstance;
  readonly basePath?: string;
}

/**
 * Query hook that fetches all registered webhook event types.
 *
 * The data is immutable at runtime (only changes on application restart),
 * so an aggressive staleTime is used.
 */
export function useEventTypes(
  options: EventTypesOptions
): UseQueryResult<WebhookEventTypeResponse[]> {
  const { client, basePath = DEFAULT_WEBHOOKS_BASE_PATH } = options;

  return useQuery({
    queryKey: [...webhooksKeys.all, 'event-types'],
    queryFn: () => getEventTypes(client, basePath),
    staleTime: Infinity,
  });
}
