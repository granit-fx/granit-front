import { listAIProviderModels } from '@granit/ai';
import { useQuery } from '@tanstack/react-query';

import { useAIConfig } from '../providers/ai-provider';

import { aiKeys } from './query-keys';

import type { AIProviderModelResponse } from '@granit/ai';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch available models for a given AI provider.
 *
 * The query is automatically disabled when `providerName` is `undefined` or empty,
 * enabling a cascading select pattern (provider → models).
 *
 * @example
 * ```tsx
 * const { data: models } = useAIProviderModels('OpenAI');
 * models?.map(m => <option key={m.id}>{m.displayName}</option>);
 * ```
 */
export function useAIProviderModels(
  providerName: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<readonly AIProviderModelResponse[]> {
  const config = useAIConfig();
  const hasProvider = !!providerName;

  return useQuery({
    queryKey: aiKeys.providerModels(config.queryKeyPrefix, providerName ?? ''),
    queryFn: () => listAIProviderModels(config.client, config.basePath, providerName!),
    enabled: hasProvider && (options?.enabled ?? true),
  });
}
