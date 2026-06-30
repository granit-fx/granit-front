import { getPrompt } from '@granit/ai-prompts';
import { useQuery } from '@tanstack/react-query';

import { logger } from '../logger';
import { useAIPromptsConfig } from '../providers/ai-prompts-provider';

import { promptKeys } from './query-keys';

const log = logger.child('Detail');

import type { PromptId, PromptResponse } from '@granit/ai-prompts';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch one prompt with its instruction text (e.g. to populate the edit form).
 *
 * @param id - the prompt id, or `null` to disable the query.
 */
export function usePrompt(
  id: PromptId | null,
  options?: { enabled?: boolean }
): UseQueryResult<PromptResponse> {
  const config = useAIPromptsConfig();
  return useQuery({
    queryKey: promptKeys.detail(config.queryKeyPrefix, id ?? ('' as PromptId)),
    queryFn: () => {
      log.debug('Fetching prompt detail', { id });
      return getPrompt(config.client, config.basePath, id as PromptId);
    },
    enabled: (options?.enabled ?? true) && id !== null,
  });
}
