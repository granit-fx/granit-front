import { createSubscription, deleteSubscription, updateSubscription } from '@granit/webhooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useWebhooksConfig } from '../providers/webhooks-provider.js';

import { webhooksKeys } from './query-keys.js';

import type {
  WebhookSubscriptionCreateRequest,
  WebhookSubscriptionCreatedResponse,
  WebhookSubscriptionResponse,
  WebhookSubscriptionUpdateRequest,
} from '@granit/webhooks';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Mutation hook to create a new webhook subscription.
 *
 * Returns the created subscription with the signing secret (shown once).
 * Invalidates subscription queries on success.
 */
export function useCreateSubscription(): UseMutationResult<
  WebhookSubscriptionCreatedResponse,
  Error,
  WebhookSubscriptionCreateRequest
> {
  const { client, basePath } = useWebhooksConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: WebhookSubscriptionCreateRequest) =>
      createSubscription(client, `${basePath}/subscriptions`, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webhooksKeys.subscriptions() });
    },
  });
}

/**
 * Mutation hook to update a webhook subscription's target URL.
 *
 * Invalidates subscription queries on success.
 */
export function useUpdateSubscription(): UseMutationResult<
  WebhookSubscriptionResponse,
  Error,
  { id: string; request: WebhookSubscriptionUpdateRequest }
> {
  const { client, basePath } = useWebhooksConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) =>
      updateSubscription(client, `${basePath}/subscriptions`, id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webhooksKeys.subscriptions() });
    },
  });
}

/**
 * Mutation hook to delete a webhook subscription.
 *
 * Invalidates subscription queries on success.
 */
export function useDeleteSubscription(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useWebhooksConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSubscription(client, `${basePath}/subscriptions`, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webhooksKeys.subscriptions() });
    },
  });
}
