import { getBlob } from '@granit/blob-storage';
import { useQuery } from '@tanstack/react-query';

import { useBlobStorageConfig } from '../providers/blob-storage-provider.js';

import { blobStorageKeys } from './query-keys.js';

import type { BlobDescriptorResponse } from '@granit/blob-storage';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches a single blob descriptor by ID.
 *
 * The query is disabled when `id` or `containerName` is empty.
 *
 * @example
 * ```tsx
 * const { data: blob } = useBlob('abc-123', 'medical-images');
 * ```
 */
export function useBlob(
  id: string,
  containerName: string
): UseQueryResult<BlobDescriptorResponse> {
  const { client, basePath } = useBlobStorageConfig();

  return useQuery({
    queryKey: blobStorageKeys.blob(id, containerName),
    queryFn: () => getBlob(client, `${basePath}/blobs`, id, containerName),
    enabled: id.length > 0 && containerName.length > 0,
  });
}
