import type { GrantShareRequest, ListSharesResponse, ShareResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List active share grants directly attached to a folder (path-based
 * inheritance is not flattened in this listing).
 *
 * `GET {basePath}/folders/{folderId}/shares`
 */
export async function listFolderShares(
  client: AxiosInstance,
  basePath: string,
  folderId: string
): Promise<ListSharesResponse> {
  const response = await client.get<ListSharesResponse>(
    `${basePath}/folders/${encodeURIComponent(folderId)}/shares`
  );
  return response.data;
}

/**
 * Grant a share on a folder. When `isDefault` is true (backend default), the
 * grant inherits to descendants via the path-based effective-permission
 * resolver (F6.4).
 *
 * `POST {basePath}/folders/{folderId}/shares`
 */
export async function grantFolderShare(
  client: AxiosInstance,
  basePath: string,
  folderId: string,
  request: GrantShareRequest
): Promise<ShareResponse> {
  const response = await client.post<ShareResponse>(
    `${basePath}/folders/${encodeURIComponent(folderId)}/shares`,
    request
  );
  return response.data;
}

/**
 * List active share grants directly attached to a document. Inherited grants
 * from the parent folder are not included — see the F6.5 effective ACL field
 * on the document response for the resolved view.
 *
 * `GET {basePath}/documents/{documentId}/shares`
 */
export async function listDocumentShares(
  client: AxiosInstance,
  basePath: string,
  documentId: string
): Promise<ListSharesResponse> {
  const response = await client.get<ListSharesResponse>(
    `${basePath}/documents/${encodeURIComponent(documentId)}/shares`
  );
  return response.data;
}

/**
 * Grant a share on a document. The `isDefault` flag is ignored for document
 * shares (it only controls folder-share inheritance).
 *
 * `POST {basePath}/documents/{documentId}/shares`
 */
export async function grantDocumentShare(
  client: AxiosInstance,
  basePath: string,
  documentId: string,
  request: GrantShareRequest
): Promise<ShareResponse> {
  const response = await client.post<ShareResponse>(
    `${basePath}/documents/${encodeURIComponent(documentId)}/shares`,
    request
  );
  return response.data;
}

/**
 * Revoke a share grant. Share ids are globally unique inside a tenant; the
 * endpoint is not nested under folders/documents.
 *
 * `DELETE {basePath}/shares/{id}`
 */
export async function revokeShare(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete<void>(`${basePath}/shares/${encodeURIComponent(id)}`);
}
