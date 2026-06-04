import { cleanupOrphans } from '@granit/blob-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useBlobStorageConfig } from '../providers/blob-storage-provider';

import { blobListQueryKey, blobStorageKeys } from './query-keys';

import type { BlobCleanupOrphansResponse } from '@granit/blob-storage';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Mutation hook to clean up orphaned blobs stuck in Pending/Uploading state.
 *
 * Sends `POST {basePath}/cleanup-orphans`. Typically used by admin interfaces.
 *
 * @example
 * ```tsx
 * const { mutateAsync: cleanup } = useCleanupOrphans();
 * const { cleanedCount } = await cleanup();
 * ```
 */
export function useCleanupOrphans(): UseMutationResult<BlobCleanupOrphansResponse, Error, void> {
  const config = useBlobStorageConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cleanupOrphans(config.client, `${config.basePath}/blobs`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: blobStorageKeys.blobs() }),
        queryClient.invalidateQueries({ queryKey: blobListQueryKey(config) }),
      ]);
    },
  });
}
