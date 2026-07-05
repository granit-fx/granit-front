import type {
  BlogPostAttachmentAddRequest,
  BlogPostAttachmentDescribeRequest,
  BlogPostAttachmentReorderRequest,
  BlogPostCreateRequest,
  BlogPostDraftContentRequest,
  BlogPostDraftContentResponse,
  BlogPostResponse,
  BlogPostUpdateRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * `POST {basePath}/sites/{siteId}/posts` — create a post shell (metadata only;
 * content is authored per-culture via {@link saveDraftContent}). Requires
 * `Blog.Posts.Manage`. Throws on 409 (slug conflict).
 */
export async function createPost(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  request: BlogPostCreateRequest
): Promise<BlogPostResponse> {
  const res = await client.post<BlogPostResponse>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/posts`,
    request
  );
  return res.data;
}

/** `GET {basePath}/posts/{id}`. Requires `Blog.Posts.Read`. */
export async function getPost(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<BlogPostResponse> {
  const res = await client.get<BlogPostResponse>(`${basePath}/posts/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * `PUT {basePath}/posts/{id}` — update metadata. Requires `Blog.Posts.Manage`.
 * Throws on 404 or 409 (stale `concurrencyStamp` / slug conflict).
 */
export async function updatePost(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: BlogPostUpdateRequest
): Promise<BlogPostResponse> {
  const res = await client.put<BlogPostResponse>(
    `${basePath}/posts/${encodeURIComponent(id)}`,
    request
  );
  return res.data;
}

/** `DELETE {basePath}/posts/{id}`. Requires `Blog.Posts.Manage`. Returns `204`. */
export async function deletePost(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/posts/${encodeURIComponent(id)}`);
}

/**
 * `PUT {basePath}/posts/{id}/content` — copy-on-write draft for one culture.
 * Requires `Blog.Posts.Manage`. Throws on 404 or 409 (`DraftConcurrency` /
 * `StalePost`).
 */
export async function saveDraftContent(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: BlogPostDraftContentRequest
): Promise<BlogPostDraftContentResponse> {
  const res = await client.put<BlogPostDraftContentResponse>(
    `${basePath}/posts/${encodeURIComponent(id)}/content`,
    request
  );
  return res.data;
}

// ─── Media gallery ──────────────────────────────────────────────────────────

/** `POST {basePath}/posts/{id}/attachments`. Requires `Blog.Posts.Manage`. */
export async function addPostAttachment(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: BlogPostAttachmentAddRequest
): Promise<BlogPostResponse> {
  const res = await client.post<BlogPostResponse>(
    `${basePath}/posts/${encodeURIComponent(id)}/attachments`,
    request
  );
  return res.data;
}

/** `PATCH {basePath}/posts/{id}/attachments/{documentId}`. Requires `Blog.Posts.Manage`. */
export async function updatePostAttachment(
  client: AxiosInstance,
  basePath: string,
  id: string,
  documentId: string,
  request: BlogPostAttachmentDescribeRequest
): Promise<BlogPostResponse> {
  const res = await client.patch<BlogPostResponse>(
    `${basePath}/posts/${encodeURIComponent(id)}/attachments/${encodeURIComponent(documentId)}`,
    request
  );
  return res.data;
}

/** `DELETE {basePath}/posts/{id}/attachments/{documentId}`. Requires `Blog.Posts.Manage`. */
export async function removePostAttachment(
  client: AxiosInstance,
  basePath: string,
  id: string,
  documentId: string
): Promise<BlogPostResponse> {
  const res = await client.delete<BlogPostResponse>(
    `${basePath}/posts/${encodeURIComponent(id)}/attachments/${encodeURIComponent(documentId)}`
  );
  return res.data;
}

/**
 * `PUT {basePath}/posts/{id}/attachments/order` — reorder the gallery. The body
 * must be the exact current set of attachment document ids (422 otherwise).
 * Requires `Blog.Posts.Manage`.
 */
export async function reorderPostAttachments(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: BlogPostAttachmentReorderRequest
): Promise<BlogPostResponse> {
  const res = await client.put<BlogPostResponse>(
    `${basePath}/posts/${encodeURIComponent(id)}/attachments/order`,
    request
  );
  return res.data;
}
