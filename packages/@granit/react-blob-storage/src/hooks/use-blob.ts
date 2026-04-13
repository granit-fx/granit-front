import { blobStorageKeys, getBlob } from '@granit/blob-storage';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { BlobDescriptorResponse } from '@granit/blob-storage';
import type { UseQueryResult } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';

/** Options accepted by all blob-storage hooks. */
export interface BlobStorageOptions {
  /** Axios instance used for all requests. */
  readonly client: AxiosInstance;
  /** Base URL for the blob-storage API. Defaults to `/api/v1/blob-storage`. */
  readonly basePath?: string;
}

/**
 * Query hook that fetches a single blob descriptor by ID.
 *
 * The query is disabled when `id` or `containerName` is empty.
 *
 * @example
 * ```tsx
 * const { data: blob } = useBlob('abc-123', 'medical-images', { client: api });
 * ```
 */
export function useBlob(
  id: string,
  containerName: string,
  options: BlobStorageOptions
): UseQueryResult<BlobDescriptorResponse> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;

  return useQuery({
    queryKey: blobStorageKeys.blob(id, containerName),
    queryFn: () => getBlob(client, `${basePath}/blobs`, id, containerName),
    enabled: id.length > 0 && containerName.length > 0,
  });
}
