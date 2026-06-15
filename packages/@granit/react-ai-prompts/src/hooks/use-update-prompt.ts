import { updatePrompt } from '@granit/ai-prompts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAIPromptsConfig } from '../providers/ai-prompts-provider';

import { promptKeys } from './query-keys';

import type { PromptId, PromptResponse, UpdatePromptRequest } from '@granit/ai-prompts';

export interface UpdatePromptVariables {
  readonly id: PromptId;
  readonly request: UpdatePromptRequest;
}

export interface UseUpdatePromptReturn {
  readonly update: (variables: UpdatePromptVariables) => void;
  readonly updateAsync: (variables: UpdatePromptVariables) => Promise<PromptResponse>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to update one of the caller's own prompts. Invalidates the list,
 * picker, and the affected detail on success. System prompts are read-only
 * (the backend returns 404 — offer Customise instead).
 */
export function useUpdatePrompt(): UseUpdatePromptReturn {
  const config = useAIPromptsConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, request }: UpdatePromptVariables) =>
      updatePrompt(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => {
      queryClient
        .invalidateQueries({ queryKey: promptKeys.list(config.queryKeyPrefix) })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: promptKeys.picker(config.queryKeyPrefix) })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: promptKeys.detail(config.queryKeyPrefix, id) })
        .catch(() => undefined);
    },
  });

  const update = useCallback(
    (variables: UpdatePromptVariables) => {
      mutation.mutate(variables);
    },
    [mutation]
  );

  const updateAsync = useCallback(
    async (variables: UpdatePromptVariables) => mutation.mutateAsync(variables),
    [mutation]
  );

  return { update, updateAsync, isPending: mutation.isPending, error: mutation.error };
}
