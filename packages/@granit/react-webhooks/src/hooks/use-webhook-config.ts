import { getConfig } from '@granit/webhooks';
import { useQuery } from '@tanstack/react-query';

import { useWebhooksConfig } from '../providers/webhooks-provider.js';

import type { WebhookModuleConfig } from '@granit/webhooks';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches webhook module configuration.
 *
 * The result is cached permanently (staleTime: Infinity) since module config rarely changes.
 */
export function useWebhookConfig(): UseQueryResult<WebhookModuleConfig> {
  const { client, basePath } = useWebhooksConfig();

  return useQuery({
    queryKey: ['webhooks', 'config'],
    queryFn: () => getConfig(client, basePath),
    staleTime: Infinity,
  });
}
