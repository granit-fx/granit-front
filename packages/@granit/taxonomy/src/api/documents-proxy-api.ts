import type { TagResponse } from '../types.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Documents-proxy endpoints (`/api/v1/documents/{id}/tags`) — UX shortcut on
 * the Documents surface backed by the same canonical taxonomy store. The
 * `targetType` and `targetId` are implicit in the URL shape, so callers don't
 * supply them.
 *
 * Use these for the Documents detail page only. Anywhere else, prefer the
 * canonical {@link tags-api} functions so the same scope/target shape works
 * across modules.
 */

/**
 * List the tags currently assigned to a document.
 *
 * `GET {basePath}/documents/{documentId}/tags`
 */
export async function listDocumentTags(
  client: AxiosInstance,
  basePath: string,
  documentId: string
): Promise<readonly TagResponse[]> {
  const response = await client.get<readonly TagResponse[]>(
    `${basePath}/documents/${encodeURIComponent(documentId)}/tags`
  );
  return response.data;
}

/**
 * Attach an existing tag to a document.
 *
 * `POST {basePath}/documents/{documentId}/tags/{tagId}`
 */
export async function attachTagToDocument(
  client: AxiosInstance,
  basePath: string,
  documentId: string,
  tagId: string
): Promise<void> {
  await client.post<void>(
    `${basePath}/documents/${encodeURIComponent(documentId)}/tags/${encodeURIComponent(tagId)}`
  );
}

/**
 * Detach a tag from a document.
 *
 * `DELETE {basePath}/documents/{documentId}/tags/{tagId}`
 */
export async function detachTagFromDocument(
  client: AxiosInstance,
  basePath: string,
  documentId: string,
  tagId: string
): Promise<void> {
  await client.delete<void>(
    `${basePath}/documents/${encodeURIComponent(documentId)}/tags/${encodeURIComponent(tagId)}`
  );
}
