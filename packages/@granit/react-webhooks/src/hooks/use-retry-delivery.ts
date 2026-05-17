import { retryDelivery } from '@granit/webhooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useWebhooksConfig } from '../providers/webhooks-provider.js';

import { webhooksKeys } from './query-keys.js';

import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Mutation hook to retry a previously failed webhook delivery attempt.
 *
 * Invalidates the deliveries query for the related subscription on success.
 */
export function useRetryDelivery(): UseMutationResult<
  void,
  Error,
  { deliveryId: string; subscriptionId: string }
> {
  const { client, basePath } = useWebhooksConfig();
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
