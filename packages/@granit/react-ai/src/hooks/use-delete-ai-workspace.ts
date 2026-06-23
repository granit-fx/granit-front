import { deleteAIWorkspace } from '@granit/ai';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAIConfig } from '../providers/ai-provider';

import { aiKeys } from './query-keys';

export interface UseDeleteAIWorkspaceReturn {
  readonly remove: (key: string) => void;
  readonly removeAsync: (key: string) => Promise<void>;
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
    mutationFn: (key: string) => deleteAIWorkspace(config.client, config.basePath, key),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: aiKeys.workspaces(config.queryKeyPrefix) })
        .catch(() => undefined);
    },
  });

  const remove = useCallback(
    (key: string) => {
      mutation.mutate(key);
    },
    [mutation]
  );

  const removeAsync = useCallback(
    async (key: string) => {
      await mutation.mutateAsync(key);
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
