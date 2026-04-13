import { blobStorageKeys, confirmUpload, deleteBlob, initiateUpload } from '@granit/blob-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { BlobStorageOptions } from './use-blob.js';
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
 * const { mutateAsync: initiate } = useInitiateUpload({ client: api });
 * const ticket = await initiate({ containerName: 'docs', fileName: 'report.pdf', contentType: 'application/pdf', sizeBytes: 4096 });
 * ```
 */
export function useInitiateUpload(
  options: BlobStorageOptions
): UseMutationResult<BlobUploadInitiateResponse, Error, BlobUploadInitiateRequest> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;

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
 * const { mutateAsync: confirm } = useConfirmUpload({ client: api });
 * const result = await confirm({ id: 'abc-123', request: { containerName: 'docs' } });
 * ```
 */
export function useConfirmUpload(
  options: BlobStorageOptions
): UseMutationResult<
  BlobConfirmUploadResponse,
  Error,
  { id: string; request: BlobConfirmUploadRequest }
> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
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
 * const { mutate: remove } = useDeleteBlob({ client: api });
 * remove({ id: 'abc-123', request: { containerName: 'docs', deletionReason: 'RGPD Art. 17' } });
 * ```
 */
export function useDeleteBlob(
  options: BlobStorageOptions
): UseMutationResult<void, Error, { id: string; request: BlobDeleteRequest }> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => deleteBlob(client, `${basePath}/blobs`, id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blobStorageKeys.blobs() });
    },
  });
}
