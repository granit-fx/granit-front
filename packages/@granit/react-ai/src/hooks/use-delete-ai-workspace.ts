import { deleteAIWorkspace } from '@granit/ai';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildAIQueryKey, useAIConfig } from '../providers/ai-provider';

export interface UseDeleteAIWorkspaceReturn {
  readonly remove: (name: string) => void;
  readonly removeAsync: (name: string) => Promise<void>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to delete a dynamic AI workspace.
 *
 * Invalidates the workspaces list on success.
 *
 * @example
 * ```tsx
 * const { remove } = useDeleteAIWorkspace();
 * remove('my-ws');
 * ```
 */
export function useDeleteAIWorkspace(): UseDeleteAIWorkspaceReturn {
  const config = useAIConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (name: string) => deleteAIWorkspace(config.client, config.basePath ?? '', name),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: buildAIQueryKey(config, 'workspaces') })
        .catch(() => undefined);
    },
  });

  const remove = useCallback(
    (name: string) => {
      mutation.mutate(name);
    },
    [mutation]
  );

  const removeAsync = useCallback(
    async (name: string) => {
      await mutation.mutateAsync(name);
    },
    [mutation]
  );

  return {
    remove,
    removeAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
