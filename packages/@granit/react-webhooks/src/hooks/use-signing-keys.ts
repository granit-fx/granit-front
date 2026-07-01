import { createSigningKey, deleteSigningKey, listSigningKeys } from '@granit/webhooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useWebhooksConfig } from '../providers/webhooks-provider';

import { webhooksKeys } from './query-keys';

import type { WebhookSigningKeyCreatedResponse, WebhookSigningKeyResponse } from '@granit/webhooks';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that lists the signing keys of a subscription
 * (Active, Retired within the grace period, and Revoked).
 *
 * The query is disabled when `subscriptionId` is empty.
 */
export function useSigningKeys(
  subscriptionId: string
): UseQueryResult<WebhookSigningKeyResponse[]> {
  const { client, basePath } = useWebhooksConfig();

  return useQuery({
    queryKey: webhooksKeys.signingKeys(subscriptionId),
    queryFn: () => listSigningKeys(client, `${basePath}/subscriptions`, subscriptionId),
    enabled: subscriptionId.length > 0,
  });
}

/**
 * Mutation hook to create a new signing key for a subscription.
 *
 * The new plaintext secret is returned exactly once — store it securely.
 * Invalidates the keys list and the subscription (its `signingSecretHint`
 * is refreshed) on success.
 */
export function useCreateSigningKey(): UseMutationResult<
  WebhookSigningKeyCreatedResponse,
  Error,
  string
> {
  const { client, basePath } = useWebhooksConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => createSigningKey(client, `${basePath}/subscriptions`, id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: webhooksKeys.signingKeys(id) }),
        queryClient.invalidateQueries({ queryKey: webhooksKeys.subscription(id) }),
      ]);
    },
  });
}

/**
 * Mutation hook to delete a specific signing key.
 *
 * The last Active key cannot be deleted — create a new key first, then delete
 * the old one (the backend rejects the request otherwise). Invalidates the keys
 * list on success.
 */
export function useDeleteSigningKey(): UseMutationResult<
  void,
  Error,
  { subscriptionId: string; keyId: string }
> {
  const { client, basePath } = useWebhooksConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriptionId, keyId }) =>
      deleteSigningKey(client, `${basePath}/subscriptions`, subscriptionId, keyId),
    onSuccess: async (_data, { subscriptionId }) => {
      await queryClient.invalidateQueries({
        queryKey: webhooksKeys.signingKeys(subscriptionId),
      });
    },
  });
}
