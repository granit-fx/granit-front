import type {
  CreatePublicLinkRequest,
  CreatePublicLinkResponse,
  PublicLinkResponse,
  RevokePublicLinkRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Create a public link for a document. Returns 201 with the link token and
 * the full redemption URL. Returns 403 when the caller lacks the manage
 * permission, 404 when the document does not exist.
 *
 * `POST {basePath}/documents/{id}/public-links`
 */
export async function createDocumentPublicLink(
  client: AxiosInstance,
  basePath: string,
  documentId: string,
  request: CreatePublicLinkRequest
): Promise<CreatePublicLinkResponse> {
  const response = await client.post<CreatePublicLinkResponse>(
    `${basePath}/documents/${encodeURIComponent(documentId)}/public-links`,
    request
  );
  return response.data;
}

/**
 * List all active public links for a document.
 *
 * `GET {basePath}/documents/{id}/public-links`
 */
export async function listDocumentPublicLinks(
  client: AxiosInstance,
  basePath: string,
  documentId: string
): Promise<readonly PublicLinkResponse[]> {
  const response = await client.get<readonly PublicLinkResponse[]>(
    `${basePath}/documents/${encodeURIComponent(documentId)}/public-links`
  );
  return response.data;
}

/**
 * Revoke a public link. The `reason` field may be `null`. Returns 404 when
 * the link does not exist or has already been revoked.
 *
 * `DELETE {basePath}/public-links/{id}`
 */
export async function revokeDocumentPublicLink(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: RevokePublicLinkRequest
): Promise<void> {
  await client.delete<void>(`${basePath}/public-links/${encodeURIComponent(id)}`, {
    data: request,
  });
}
