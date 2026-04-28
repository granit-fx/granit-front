import { getConfig } from '@granit/webhooks';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_WEBHOOKS_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { WebhookModuleConfig } from '@granit/webhooks';
import type { UseQueryResult } from '@tanstack/react-query';

export interface WebhookConfigOptions {
  readonly client: AxiosInstance;
  readonly basePath?: string;
}

/**
 * Query hook that fetches webhook module configuration.
 *
 * The result is cached permanently (staleTime: Infinity) since module config rarely changes.
 */
export function useWebhookConfig(
  options: WebhookConfigOptions
): UseQueryResult<WebhookModuleConfig> {
  const { client, basePath = DEFAULT_WEBHOOKS_BASE_PATH } = options;

  return useQuery({
    queryKey: ['webhooks', 'config'],
    queryFn: () => getConfig(client, basePath),
    staleTime: Infinity,
  });
}
