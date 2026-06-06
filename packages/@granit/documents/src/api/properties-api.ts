import type { DocumentPropertiesResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Get the extracted metadata for the current (or latest) version of a
 * document. Returns 404 when no properties row exists yet (extraction pending).
 *
 * `GET {basePath}/documents/{id}/metadata`
 */
export async function getDocumentProperties(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<DocumentPropertiesResponse> {
  const response = await client.get<DocumentPropertiesResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}/metadata`
  );
  return response.data;
}

/**
 * Get the extracted metadata for a specific version of a document.
 *
 * `GET {basePath}/documents/{id}/versions/{versionId}/metadata`
 */
export async function getDocumentVersionProperties(
  client: AxiosInstance,
  basePath: string,
  id: string,
  versionId: string
): Promise<DocumentPropertiesResponse> {
  const response = await client.get<DocumentPropertiesResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/metadata`
  );
  return response.data;
}
