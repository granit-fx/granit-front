import { getPromptPicker } from '@granit/ai-prompts';
import { useQuery } from '@tanstack/react-query';

import { logger } from '../logger';
import { useAIPromptsConfig } from '../providers/ai-prompts-provider';

import { promptKeys } from './query-keys';

const log = logger.child('Picker');

import type { PromptPickerResponse } from '@granit/ai-prompts';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch the catalogue grouped by category for the chat `/` picker. Feed the
 * flattened items to `@granit/react-ai-chat`'s `<ChatComposer prompts>`.
 */
export function usePromptPicker(options?: {
  enabled?: boolean;
}): UseQueryResult<PromptPickerResponse> {
  const config = useAIPromptsConfig();
  return useQuery({
    queryKey: promptKeys.picker(config.queryKeyPrefix),
    queryFn: () => {
      log.debug('Fetching prompt picker catalogue');
      return getPromptPicker(config.client, config.basePath);
    },
    enabled: options?.enabled ?? true,
  });
}
