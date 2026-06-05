import { testPing } from '@granit/webhooks';
import { useMutation } from '@tanstack/react-query';

import { useWebhooksConfig } from '../providers/webhooks-provider';

import type { WebhookSubscriptionTestPingResponse } from '@granit/webhooks';
import type { UseMutationResult } from '@tanstack/react-query';

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
