import type { DocumentTagAssignmentResponse, ListDocumentTagsResponse } from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List every tag currently assigned to a document. Proxy over Granit.Taxonomy:
 * the canonical store lives there; this endpoint is a UX shortcut on the
 * Documents surface (T6.1).
 *
 * `GET {basePath}/documents/{id}/tags`
 */
export async function listDocumentTags(
  client: AxiosInstance,
  basePath: string,
  documentId: string
): Promise<ListDocumentTagsResponse> {
  const response = await client.get<ListDocumentTagsResponse>(
    `${basePath}/documents/${encodeURIComponent(documentId)}/tags`
  );
  return response.data;
}

/**
 * Assign a tag to a document. Idempotent: re-posting the same `(document, tag)`
 * pair returns the existing row (HTTP 200) instead of creating a duplicate
 * (HTTP 201).
 *
 * `POST {basePath}/documents/{id}/tags/{tagId}`
 */
export async function assignDocumentTag(
  client: AxiosInstance,
  basePath: string,
  documentId: string,
  tagId: string
): Promise<DocumentTagAssignmentResponse> {
  const response = await client.post<DocumentTagAssignmentResponse>(
    `${basePath}/documents/${encodeURIComponent(documentId)}/tags/${encodeURIComponent(tagId)}`
  );
  return response.data;
}

/**
 * Remove a tag assignment from a document. Returns 404 when no row matches
 * (the tag was never assigned, or has already been removed).
 *
 * `DELETE {basePath}/documents/{id}/tags/{tagId}`
 */
export async function unassignDocumentTag(
  client: AxiosInstance,
  basePath: string,
  documentId: string,
  tagId: string
): Promise<void> {
  await client.delete<void>(
    `${basePath}/documents/${encodeURIComponent(documentId)}/tags/${encodeURIComponent(tagId)}`
  );
}
