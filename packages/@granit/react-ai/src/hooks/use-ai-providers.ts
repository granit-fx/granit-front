import { listAIProviders } from '@granit/ai';
import { useQuery } from '@tanstack/react-query';

import { buildAIQueryKey, useAIConfig } from '../providers/ai-provider';

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
}): UseQueryResult<AIProviderResponse[]> {
  const config = useAIConfig();

  return useQuery({
    queryKey: buildAIQueryKey(config, 'providers'),
    queryFn: () => listAIProviders(config.client, config.basePath ?? ''),
    enabled: options?.enabled ?? true,
  });
}
