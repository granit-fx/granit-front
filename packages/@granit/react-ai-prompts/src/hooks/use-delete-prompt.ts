import { deletePrompt } from '@granit/ai-prompts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAIPromptsConfig } from '../providers/ai-prompts-provider';

import { promptKeys } from './query-keys';

import type { PromptId } from '@granit/ai-prompts';

export interface UseDeletePromptReturn {
  readonly remove: (id: PromptId) => void;
  readonly removeAsync: (id: PromptId) => Promise<void>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to delete one of the caller's own prompts. Invalidates the list and
 * picker on success. Requires `AIPrompts.Templates.Delete`.
 */
export function useDeletePrompt(): UseDeletePromptReturn {
  const config = useAIPromptsConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: PromptId) => deletePrompt(config.client, config.basePath, id),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: promptKeys.list(config.queryKeyPrefix) })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: promptKeys.picker(config.queryKeyPrefix) })
        .catch(() => undefined);
    },
  });

  const remove = useCallback(
    (id: PromptId) => {
      mutation.mutate(id);
    },
    [mutation]
  );

  const removeAsync = useCallback(
    async (id: PromptId) => {
      await mutation.mutateAsync(id);
    },
    [mutation]
  );

  return { remove, removeAsync, isPending: mutation.isPending, error: mutation.error };
}
