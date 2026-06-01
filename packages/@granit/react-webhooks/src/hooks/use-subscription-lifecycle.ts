import {
  activateSubscription,
  deactivateSubscription,
  suspendSubscription,
} from '@granit/webhooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useWebhooksConfig } from '../providers/webhooks-provider';

import { webhooksKeys } from './query-keys';

import type {
  WebhookSubscriptionDeactivateRequest,
  WebhookSubscriptionResponse,
} from '@granit/webhooks';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Mutation hook to activate a suspended webhook subscription.
 *
 * Invalidates subscription queries on success.
 */
export function useActivateSubscription(): UseMutationResult<
  WebhookSubscriptionResponse,
  Error,
  string
> {
  const { client, basePath } = useWebhooksConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateSubscription(client, `${basePath}/subscriptions`, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webhooksKeys.subscriptions() });
    },
  });
}

/**
 * Mutation hook to suspend a webhook subscription.
 *
 * Invalidates subscription queries on success.
 */
export function useSuspendSubscription(): UseMutationResult<
  WebhookSubscriptionResponse,
  Error,
  string
> {
  const { client, basePath } = useWebhooksConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suspendSubscription(client, `${basePath}/subscriptions`, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webhooksKeys.subscriptions() });
    },
  });
}

/**
 * Mutation hook to deactivate a webhook subscription permanently.
 *
 * Invalidates subscription queries on success.
 */
export function useDeactivateSubscription(): UseMutationResult<
  WebhookSubscriptionResponse,
  Error,
  { id: string; request: WebhookSubscriptionDeactivateRequest }
> {
  const { client, basePath } = useWebhooksConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) =>
      deactivateSubscription(client, `${basePath}/subscriptions`, id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: webhooksKeys.subscriptions() });
    },
  });
}
