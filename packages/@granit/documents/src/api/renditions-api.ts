import type {
  ListRenditionsResponse,
  RenditionDownloadUrlResponse,
  RenditionType,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List all renditions generated for the current version of a document.
 * Returns 404 when the document does not exist.
 *
 * `GET {basePath}/documents/{id}/renditions`
 */
export async function listDocumentRenditions(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ListRenditionsResponse> {
  const response = await client.get<ListRenditionsResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}/renditions`
  );
  return response.data;
}

/**
 * Get a presigned download URL for a specific rendition type. The URL is
 * short-lived. Returns 404 when the rendition does not exist or is not yet
 * `Ready`.
 *
 * `GET {basePath}/documents/{id}/renditions/{type}/download`
 */
export async function getRenditionDownloadUrl(
  client: AxiosInstance,
  basePath: string,
  id: string,
  type: RenditionType
): Promise<RenditionDownloadUrlResponse> {
  const response = await client.get<RenditionDownloadUrlResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}/renditions/${encodeURIComponent(type)}/download`
  );
  return response.data;
}
