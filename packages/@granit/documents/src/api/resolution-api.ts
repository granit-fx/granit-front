import type { BatchResolveRequest, ResolvedDocumentResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Resolve a batch of document assets to presigned CDN URLs in one round-trip.
 * Each item may target a specific version and/or rendition type. Items that
 * cannot be resolved (missing document, version, or rendition) are silently
 * omitted from the response array.
 *
 * Primarily used by the CMS renderer to embed document assets.
 *
 * `POST {basePath}/resolution/resolve`
 */
export async function batchResolveDocumentAssets(
  client: AxiosInstance,
  basePath: string,
  request: BatchResolveRequest
): Promise<readonly ResolvedDocumentResponse[]> {
  const response = await client.post<readonly ResolvedDocumentResponse[]>(
    `${basePath}/resolution/resolve`,
    request
  );
  return response.data;
}
