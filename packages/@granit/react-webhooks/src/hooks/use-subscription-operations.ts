import { rotateSecret, testPing } from '@granit/webhooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useWebhooksConfig } from '../providers/webhooks-provider';

import { webhooksKeys } from './query-keys';

import type {
  WebhookSubscriptionRotateSecretResponse,
  WebhookSubscriptionTestPingResponse,
} from '@granit/webhooks';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Mutation hook to rotate the signing secret of a subscription.
 *
 * The new secret is returned once — store it securely.
 * Invalidates the specific subscription query on success.
 */
export function useRotateSecret(): UseMutationResult<
  WebhookSubscriptionRotateSecretResponse,
  Error,
  string
> {
  const { client, basePath } = useWebhooksConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rotateSecret(client, `${basePath}/subscriptions`, id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: webhooksKeys.subscription(id) });
    },
  });
}

/**
 * Mutation hook to send a test ping to a subscription's target URL.
 */
export function useTestPing(): UseMutationResult<
  WebhookSubscriptionTestPingResponse,
  Error,
  string
> {
  const { client, basePath } = useWebhooksConfig();

  return useMutation({
    mutationFn: (id: string) => testPing(client, `${basePath}/subscriptions`, id),
  });
}
