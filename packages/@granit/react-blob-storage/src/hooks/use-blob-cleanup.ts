import { cleanupOrphans } from '@granit/blob-storage';
import { useMutation } from '@tanstack/react-query';

import { useBlobStorageConfig } from '../providers/blob-storage-provider';

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
  const { client, basePath } = useBlobStorageConfig();

  return useMutation({
    mutationFn: () => cleanupOrphans(client, `${basePath}/blobs`),
  });
}
