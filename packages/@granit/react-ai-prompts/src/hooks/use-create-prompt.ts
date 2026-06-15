import { createPrompt } from '@granit/ai-prompts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAIPromptsConfig } from '../providers/ai-prompts-provider';

import { promptKeys } from './query-keys';

import type { CreatePromptRequest, PromptResponse } from '@granit/ai-prompts';

export interface UseCreatePromptReturn {
  readonly create: (request: CreatePromptRequest) => void;
  readonly createAsync: (request: CreatePromptRequest) => Promise<PromptResponse>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to create a private prompt. Invalidates the list and picker on
 * success. Requires `AIPrompts.Templates.Manage`.
 */
export function useCreatePrompt(): UseCreatePromptReturn {
  const config = useAIPromptsConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: CreatePromptRequest) =>
      createPrompt(config.client, config.basePath, request),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: promptKeys.list(config.queryKeyPrefix) })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: promptKeys.picker(config.queryKeyPrefix) })
        .catch(() => undefined);
    },
  });

  const create = useCallback(
    (request: CreatePromptRequest) => {
      mutation.mutate(request);
    },
    [mutation]
  );

  const createAsync = useCallback(
    async (request: CreatePromptRequest) => mutation.mutateAsync(request),
    [mutation]
  );

  return { create, createAsync, isPending: mutation.isPending, error: mutation.error };
}
