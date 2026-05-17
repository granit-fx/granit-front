import { confirmUpload, deleteBlob, initiateUpload } from '@granit/blob-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useBlobStorageConfig } from '../providers/blob-storage-provider.js';

import { blobStorageKeys } from './query-keys.js';

import type {
  BlobConfirmUploadRequest,
  BlobConfirmUploadResponse,
  BlobDeleteRequest,
  BlobUploadInitiateRequest,
  BlobUploadInitiateResponse,
} from '@granit/blob-storage';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Mutation hook to initiate a direct-to-cloud upload.
 *
 * Sends `POST {basePath}/upload` and returns a pre-signed URL.
 *
 * @example
 * ```tsx
 * const { mutateAsync: initiate } = useInitiateUpload();
 * const ticket = await initiate({ containerName: 'docs', fileName: 'report.pdf', contentType: 'application/pdf', sizeBytes: 4096 });
 * ```
 */
export function useInitiateUpload(): UseMutationResult<
  BlobUploadInitiateResponse,
  Error,
  BlobUploadInitiateRequest
> {
  const { client, basePath } = useBlobStorageConfig();

  return useMutation({
    mutationFn: (request: BlobUploadInitiateRequest) =>
      initiateUpload(client, `${basePath}/blobs`, request),
  });
}

/**
 * Mutation hook to confirm a client-side upload.
 *
 * Sends `POST {basePath}/{id}/confirm` and runs the server validation pipeline.
 * Invalidates blob queries on success.
 *
 * @example
 * ```tsx
 * const { mutateAsync: confirm } = useConfirmUpload();
 * const result = await confirm({ id: 'abc-123', request: { containerName: 'docs' } });
 * ```
 */
export function useConfirmUpload(): UseMutationResult<
  BlobConfirmUploadResponse,
  Error,
  { id: string; request: BlobConfirmUploadRequest }
> {
  const { client, basePath } = useBlobStorageConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => confirmUpload(client, `${basePath}/blobs`, id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blobStorageKeys.blobs() });
    },
  });
}

/**
 * Mutation hook to delete a blob (crypto-shredding).
 *
 * Sends `DELETE {basePath}/{id}` with the container name in the request body.
 * Invalidates blob queries on success.
 *
 * @example
 * ```tsx
 * const { mutate: remove } = useDeleteBlob();
 * remove({ id: 'abc-123', request: { containerName: 'docs', deletionReason: 'RGPD Art. 17' } });
 * ```
 */
export function useDeleteBlob(): UseMutationResult<
  void,
  Error,
  { id: string; request: BlobDeleteRequest }
> {
  const { client, basePath } = useBlobStorageConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => deleteBlob(client, `${basePath}/blobs`, id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blobStorageKeys.blobs() });
    },
  });
}
