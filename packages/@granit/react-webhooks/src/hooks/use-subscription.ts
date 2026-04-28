import { getSubscription, webhooksKeys } from '@granit/webhooks';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { WebhookSubscriptionResponse } from '@granit/webhooks';
import type { UseQueryResult } from '@tanstack/react-query';

/** Options accepted by all webhook hooks. */
export interface WebhooksOptions {
  /** Axios instance used for all requests. */
  readonly client: AxiosInstance;
  /** Base URL for the webhooks API. Defaults to `/api/v1/webhooks/subscriptions`. */
  readonly basePath?: string;
}

/**
 * Query hook that fetches a single webhook subscription by ID.
 *
 * The query is disabled when `id` is empty.
 */
export function useSubscription(
  id: string,
  options: WebhooksOptions
): UseQueryResult<WebhookSubscriptionResponse> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;

  return useQuery({
    queryKey: webhooksKeys.subscription(id),
    queryFn: () => getSubscription(client, basePath, id),
    enabled: id.length > 0,
  });
}
