import { listAIProviders } from '@granit/ai';
import { useQuery } from '@tanstack/react-query';

import { useAIConfig } from '../providers/ai-provider';

import { aiKeys } from './query-keys';

import type { AIProviderResponse } from '@granit/ai';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch all registered AI providers.
 *
 * @example
 * ```tsx
 * const { data: providers } = useAIProviders();
 * providers?.map(p => <option key={p.name}>{p.name}</option>);
 * ```
 */
export function useAIProviders(options?: {
  enabled?: boolean;
}): UseQueryResult<readonly AIProviderResponse[]> {
  const config = useAIConfig();

  return useQuery({
    queryKey: aiKeys.providers(config.queryKeyPrefix),
    queryFn: () => listAIProviders(config.client, config.basePath),
    enabled: options?.enabled ?? true,
  });
}
