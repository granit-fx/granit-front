import { updateAIWorkspace } from '@granit/ai';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildAIQueryKey, useAIConfig } from '../providers/ai-provider';

import type { AIWorkspaceResponse, AIWorkspaceUpdateRequest } from '@granit/ai';

export interface UseUpdateAIWorkspaceReturn {
  readonly update: (name: string, request: AIWorkspaceUpdateRequest) => void;
  readonly updateAsync: (
    name: string,
    request: AIWorkspaceUpdateRequest
  ) => Promise<AIWorkspaceResponse>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to update an existing dynamic AI workspace.
 *
 * Invalidates both the workspace list and the individual workspace query on success.
 *
 * @example
 * ```tsx
 * const { update } = useUpdateAIWorkspace();
 * update('my-ws', { provider: 'OpenAI', model: 'gpt-4o-mini', activated: true });
 * ```
 */
export function useUpdateAIWorkspace(): UseUpdateAIWorkspaceReturn {
  const config = useAIConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ name, request }: { name: string; request: AIWorkspaceUpdateRequest }) =>
      updateAIWorkspace(config.client, config.basePath ?? '', name, request),
    onSuccess: (_data, { name }) => {
      queryClient
        .invalidateQueries({ queryKey: buildAIQueryKey(config, 'workspaces') })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: buildAIQueryKey(config, 'workspaces', name) })
        .catch(() => undefined);
    },
  });

  const update = useCallback(
    (name: string, request: AIWorkspaceUpdateRequest) => {
      mutation.mutate({ name, request });
    },
    [mutation]
  );

  const updateAsync = useCallback(
    async (name: string, request: AIWorkspaceUpdateRequest) => {
      return mutation.mutateAsync({ name, request });
    },
    [mutation]
  );

  return {
    update,
    updateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
