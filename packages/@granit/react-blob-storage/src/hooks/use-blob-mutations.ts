import {
  cancelPendingUpload,
  confirmUpload,
  deleteBlob,
  initiateUpload,
} from '@granit/blob-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useBlobStorageConfig } from '../providers/blob-storage-provider';

import { blobListQueryKey, blobStorageKeys } from './query-keys';

import type {
  BlobCancelPendingRequest,
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
  const config = useBlobStorageConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) =>
      confirmUpload(config.client, `${config.basePath}/blobs`, id, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: blobStorageKeys.blobs() }),
        queryClient.invalidateQueries({ queryKey: blobListQueryKey(config) }),
      ]);
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
  const config = useBlobStorageConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) =>
      deleteBlob(config.client, `${config.basePath}/blobs`, id, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: blobStorageKeys.blobs() }),
        queryClient.invalidateQueries({ queryKey: blobListQueryKey(config) }),
      ]);
    },
  });
}

/**
 * Mutation hook to cancel a `Pending` upload whose pre-signed PUT failed
 * client-side.
 *
 * Sends `DELETE {basePath}/{id}/pending`, transitioning the blob straight to
 * `Rejected` (short-circuiting the orphan-cleanup window). Invalidates blob
 * queries on success. {@link useBlobUpload} calls this automatically when the
 * direct-to-cloud PUT fails — use this hook for manual cancellation flows
 * (e.g. a user aborting a stuck upload).
 *
 * @example
 * ```tsx
 * const { mutate: cancel } = useCancelPendingUpload();
 * cancel({ id: 'abc-123', request: { containerName: 'docs', reason: 'User aborted' } });
 * ```
 */
export function useCancelPendingUpload(): UseMutationResult<
  void,
  Error,
  { id: string; request: BlobCancelPendingRequest }
> {
  const config = useBlobStorageConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) =>
      cancelPendingUpload(config.client, `${config.basePath}/blobs`, id, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: blobStorageKeys.blobs() }),
        queryClient.invalidateQueries({ queryKey: blobListQueryKey(config) }),
      ]);
    },
  });
}
