import { customisePrompt } from '@granit/ai-prompts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { logger } from '../logger';
import { useAIPromptsConfig } from '../providers/ai-prompts-provider';

import { promptKeys } from './query-keys';

const log = logger.child('Customise');

import type { PromptId, PromptResponse } from '@granit/ai-prompts';

export interface UseCustomisePromptReturn {
  readonly customise: (id: PromptId) => void;
  readonly customiseAsync: (id: PromptId) => Promise<PromptResponse>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to clone a **system** prompt into a private editable copy. Returns
 * the new prompt and invalidates the list and picker. A non-system target
 * returns 409. Requires `AIPrompts.Templates.Manage`.
 */
export function useCustomisePrompt(): UseCustomisePromptReturn {
  const config = useAIPromptsConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: PromptId) => customisePrompt(config.client, config.basePath, id),
    onSuccess: (created, sourceId) => {
      log.info('Customised system prompt into an editable copy', {
        sourceId,
        id: created.id,
      });
      log.debug('Invalidating catalogue list and picker');
      queryClient
        .invalidateQueries({ queryKey: promptKeys.list(config.queryKeyPrefix) })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: promptKeys.picker(config.queryKeyPrefix) })
        .catch(() => undefined);
    },
  });

  const customise = useCallback(
    (id: PromptId) => {
      mutation.mutate(id);
    },
    [mutation]
  );

  const customiseAsync = useCallback(async (id: PromptId) => mutation.mutateAsync(id), [mutation]);

  return { customise, customiseAsync, isPending: mutation.isPending, error: mutation.error };
}
