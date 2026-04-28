import { retryDelivery, webhooksKeys } from '@granit/webhooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_WEBHOOKS_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { UseMutationResult } from '@tanstack/react-query';

export interface RetryDeliveryOptions {
  readonly client: AxiosInstance;
  /** Webhooks root path (e.g. `/api/v1/webhooks`). Defaults to `/api/v1/webhooks`. */
  readonly basePath?: string;
}

/**
 * Mutation hook to retry a previously failed webhook delivery attempt.
 *
 * Invalidates the deliveries query for the related subscription on success.
 */
export function useRetryDelivery(
  options: RetryDeliveryOptions
): UseMutationResult<void, Error, { deliveryId: string; subscriptionId: string }> {
  const { client, basePath = DEFAULT_WEBHOOKS_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deliveryId }) => retryDelivery(client, basePath, deliveryId),
    onSuccess: async (_data, { subscriptionId }) => {
      await queryClient.invalidateQueries({
        queryKey: webhooksKeys.deliveries(subscriptionId),
      });
    },
  });
}
