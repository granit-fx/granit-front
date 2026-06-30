import type { TagResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Documents-proxy endpoints (`/api/v1/documents/{id}/tags[/{tagId}]`) — UX
 * shortcut on the Documents surface backed by the same canonical taxonomy
 * store. The `targetType` and `targetId` are implicit in the URL shape, so
 * callers don't supply them.
 *
 * CROSS-DOMAIN CONTRACT — DO NOT DELETE: these routes live OUTSIDE the
 * taxonomy OpenAPI snapshot. They are exposed by the Documents endpoint
 * assembly (a thin convenience facade over the taxonomy tag store), so they
 * are intentionally absent from BOTH `contracts/openapi/taxonomy.json` (the
 * package's own oracle) AND `contracts/openapi/documents.json` (the Documents
 * snapshot does not enumerate the proxy). Conformance tooling that diffs this
 * package against `taxonomy.json` will therefore not find a match for these —
 * that is expected, not drift. Verify with:
 *   grep -oE '"/documents/\{[a-zA-Z]+\}/tags[^"]*"' contracts/openapi/documents.json
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
