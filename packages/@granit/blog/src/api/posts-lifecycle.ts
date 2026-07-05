import type { BlogPostPublicationResponse, BlogPostScheduleRequest } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * `POST {basePath}/posts/{id}/publish` — publish the current draft immediately.
 * Requires `Blog.Posts.Publish`. Throws on 404 or 422 (no draft to publish).
 */
export async function publishPost(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<BlogPostPublicationResponse> {
  const res = await client.post<BlogPostPublicationResponse>(
    `${basePath}/posts/${encodeURIComponent(id)}/publish`
  );
  return res.data;
}

/**
 * `POST {basePath}/posts/{id}/unpublish` — retract a published post.
 * Requires `Blog.Posts.Publish`. Throws on 404 or 422.
 */
export async function unpublishPost(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<BlogPostPublicationResponse> {
  const res = await client.post<BlogPostPublicationResponse>(
    `${basePath}/posts/${encodeURIComponent(id)}/unpublish`
  );
  return res.data;
}

/**
 * `POST {basePath}/posts/{id}/schedule` — schedule the current draft to publish
 * at a wall-clock local time in an IANA zone. Requires `Blog.Posts.Publish`.
 * Returns `204`. Throws on 404 or 422 (`InvalidSchedule` / no draft).
 */
export async function schedulePost(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: BlogPostScheduleRequest
): Promise<void> {
  await client.post(`${basePath}/posts/${encodeURIComponent(id)}/schedule`, request);
}

/**
 * `DELETE {basePath}/posts/{id}/schedule` — cancel a pending schedule.
 * Requires `Blog.Posts.Publish`. Returns `204`.
 */
export async function cancelPostSchedule(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/posts/${encodeURIComponent(id)}/schedule`);
}
