import type {
  BlogAuthorProfileCreateRequest,
  BlogAuthorProfileResponse,
  BlogAuthorProfileUpdateRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/** `GET {basePath}/sites/{siteId}/authors` — all author profiles for a site. Requires `Blog.Authors.Read`. */
export async function listAuthors(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  options?: { readonly signal?: AbortSignal }
): Promise<readonly BlogAuthorProfileResponse[]> {
  const res = await client.get<readonly BlogAuthorProfileResponse[]>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/authors`,
    options?.signal ? { signal: options.signal } : undefined
  );
  return res.data;
}

/** `GET {basePath}/authors/{id}`. Requires `Blog.Authors.Read`. Throws on 404. */
export async function getAuthor(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<BlogAuthorProfileResponse> {
  const res = await client.get<BlogAuthorProfileResponse>(
    `${basePath}/authors/${encodeURIComponent(id)}`
  );
  return res.data;
}

/**
 * `POST {basePath}/sites/{siteId}/authors`. Requires `Blog.Authors.Manage`.
 * Throws on 409 (`AuthorProfileConflict` — one profile per user per site).
 */
export async function createAuthor(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  request: BlogAuthorProfileCreateRequest
): Promise<BlogAuthorProfileResponse> {
  const res = await client.post<BlogAuthorProfileResponse>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/authors`,
    request
  );
  return res.data;
}

/** `PUT {basePath}/authors/{id}`. Requires `Blog.Authors.Manage`. Throws on 404. */
export async function updateAuthor(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: BlogAuthorProfileUpdateRequest
): Promise<BlogAuthorProfileResponse> {
  const res = await client.put<BlogAuthorProfileResponse>(
    `${basePath}/authors/${encodeURIComponent(id)}`,
    request
  );
  return res.data;
}

/** `DELETE {basePath}/authors/{id}`. Requires `Blog.Authors.Manage`. Returns `204`. */
export async function deleteAuthor(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/authors/${encodeURIComponent(id)}`);
}
