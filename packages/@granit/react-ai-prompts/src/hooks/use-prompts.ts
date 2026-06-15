import { listPrompts } from '@granit/ai-prompts';
import { useQuery } from '@tanstack/react-query';

import { useAIPromptsConfig } from '../providers/ai-prompts-provider';

import { promptKeys } from './query-keys';

import type { PromptSummaryResponse } from '@granit/ai-prompts';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * List the caller's catalogue (system prompts first, then own), without
 * instruction text. Backs the catalogue manager.
 */
export function usePrompts(options?: {
  enabled?: boolean;
}): UseQueryResult<readonly PromptSummaryResponse[]> {
  const config = useAIPromptsConfig();
  return useQuery({
    queryKey: promptKeys.list(config.queryKeyPrefix),
    queryFn: () => listPrompts(config.client, config.basePath),
    enabled: options?.enabled ?? true,
  });
}
