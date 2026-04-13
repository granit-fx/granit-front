import { getDownloadUrl } from '@granit/blob-storage';
import { useMutation } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { BlobStorageOptions } from './use-blob.js';
import type { BlobDownloadUrlRequest, BlobDownloadUrlResponse } from '@granit/blob-storage';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Mutation hook to generate a pre-signed download URL.
 *
 * This is a mutation (not a query) because download URLs are ephemeral
 * pre-signed URLs that should not be cached.
 *
 * @example
 * ```tsx
 * const { mutateAsync: download } = useDownloadUrl({ client: api });
 * const { downloadUrl } = await download({ id: 'abc-123', request: { containerName: 'docs' } });
 * window.open(downloadUrl);
 * ```
 */
export function useDownloadUrl(
  options: BlobStorageOptions
): UseMutationResult<
  BlobDownloadUrlResponse,
  Error,
  { id: string; request: BlobDownloadUrlRequest }
> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;

  return useMutation({
    mutationFn: ({ id, request }) => getDownloadUrl(client, `${basePath}/blobs`, id, request),
  });
}
