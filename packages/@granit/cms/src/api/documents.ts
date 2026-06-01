import type { BatchResolveDocumentsRequest, ResolvedDocumentResponse } from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Batch-resolves document GUIDs into stable, render-ready descriptors.
 * `POST {basePath}/documents/resolution/resolve`
 *
 * A `null` slot in the response means the document is missing or revoked —
 * partial success is intentional per the backend contract.
 */
export async function batchResolveDocuments(
  client: AxiosInstance,
  basePath: string,
  request: BatchResolveDocumentsRequest
): Promise<readonly (ResolvedDocumentResponse | null)[]> {
  const response = await client.post<readonly (ResolvedDocumentResponse | null)[]>(
    `${basePath}/documents/resolution/resolve`,
    request
  );
  return response.data;
}
