import type {
  BlobCancelPendingRequest,
  BlobCleanupOrphansResponse,
  BlobConfirmUploadRequest,
  BlobConfirmUploadResponse,
  BlobDeleteRequest,
  BlobDescriptorResponse,
  BlobDownloadUrlRequest,
  BlobDownloadUrlResponse,
  BlobUploadInitiateRequest,
  BlobUploadInitiateResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Initiate a direct-to-cloud upload and get a pre-signed URL.
 *
 * `POST {basePath}/upload`
 */
export async function initiateUpload(
  client: AxiosInstance,
  basePath: string,
  request: BlobUploadInitiateRequest
): Promise<BlobUploadInitiateResponse> {
  const { data } = await client.post<BlobUploadInitiateResponse>(`${basePath}/upload`, request);
  return data;
}

/**
 * Confirm a client-side upload — runs the server validation pipeline.
 *
 * `POST {basePath}/{id}/confirm`
 */
export async function confirmUpload(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: BlobConfirmUploadRequest
): Promise<BlobConfirmUploadResponse> {
  const { data } = await client.post<BlobConfirmUploadResponse>(
    `${basePath}/${encodeURIComponent(id)}/confirm`,
    request
  );
  return data;
}

/**
 * Generate a pre-signed download URL.
 *
 * `POST {basePath}/{id}/download-url`
 */
export async function getDownloadUrl(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: BlobDownloadUrlRequest
): Promise<BlobDownloadUrlResponse> {
  const { data } = await client.post<BlobDownloadUrlResponse>(
    `${basePath}/${encodeURIComponent(id)}/download-url`,
    request
  );
  return data;
}

/**
 * Delete a blob (crypto-shredding — audit record retained).
 *
 * `DELETE {basePath}/{id}`
 */
export async function deleteBlob(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: BlobDeleteRequest
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(id)}`, { data: request });
}

/**
 * Cancel a `Pending` upload whose pre-signed PUT failed client-side.
 *
 * Short-circuits the orphan-cleanup window by transitioning the blob straight
 * to `Rejected`. Returns 409 Conflict if the blob has already left `Pending`.
 *
 * `DELETE {basePath}/{id}/pending`
 */
export async function cancelPendingUpload(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: BlobCancelPendingRequest
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(id)}/pending`, { data: request });
}

/**
 * Get a blob descriptor by ID.
 *
 * `GET {basePath}/{id}?containerName=...`
 */
export async function getBlob(
  client: AxiosInstance,
  basePath: string,
  id: string,
  containerName: string
): Promise<BlobDescriptorResponse> {
  const { data } = await client.get<BlobDescriptorResponse>(
    `${basePath}/${encodeURIComponent(id)}`,
    { params: { containerName } }
  );
  return data;
}

/**
 * Clean up orphaned blobs stuck in Pending/Uploading state.
 *
 * `POST {basePath}/cleanup-orphans`
 */
export async function cleanupOrphans(
  client: AxiosInstance,
  basePath: string
): Promise<BlobCleanupOrphansResponse> {
  const { data } = await client.post<BlobCleanupOrphansResponse>(`${basePath}/cleanup-orphans`);
  return data;
}
