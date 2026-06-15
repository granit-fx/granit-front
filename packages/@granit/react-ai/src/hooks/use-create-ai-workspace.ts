import { createAIWorkspace } from '@granit/ai';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAIConfig } from '../providers/ai-provider';

import { aiKeys } from './query-keys';

import type { AIWorkspaceCreateRequest, AIWorkspaceResponse } from '@granit/ai';

export interface UseCreateAIWorkspaceReturn {
  readonly create: (request: AIWorkspaceCreateRequest) => void;
  readonly createAsync: (request: AIWorkspaceCreateRequest) => Promise<AIWorkspaceResponse>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to create a new dynamic AI workspace.
 *
 * Invalidates the workspaces list on success.
 *
 * @example
 * ```tsx
 * const { create } = useCreateAIWorkspace();
 * create({ name: 'my-ws', provider: 'OpenAI', model: 'gpt-4o' });
 * ```
 */
export function useCreateAIWorkspace(): UseCreateAIWorkspaceReturn {
  const config = useAIConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: AIWorkspaceCreateRequest) =>
      createAIWorkspace(config.client, config.basePath, request),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: aiKeys.workspaces(config.queryKeyPrefix) })
        .catch(() => undefined);
    },
  });

  const create = useCallback(
    (request: AIWorkspaceCreateRequest) => {
      mutation.mutate(request);
    },
    [mutation]
  );

  const createAsync = useCallback(
    async (request: AIWorkspaceCreateRequest) => {
      return mutation.mutateAsync(request);
    },
    [mutation]
  );

  return {
    create,
    createAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
