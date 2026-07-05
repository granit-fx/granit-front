import { getPage, getQueryMeta } from '@granit/query-engine';

import type { BlogPostListItemResponse, ListBlogPostsParams } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';

/**
 * `GET {basePath}/posts` — QueryEngine list over posts (filter/sort/paginate/export),
 * projecting {@link BlogPostListItemResponse}. Requires `Blog.Posts.Read`.
 */
export async function listPosts(
  client: AxiosInstance,
  basePath: string,
  params?: ListBlogPostsParams,
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<BlogPostListItemResponse>> {
  return getPage<BlogPostListItemResponse>(client, `${basePath}/posts`, params ?? {}, options);
}

/** `GET {basePath}/posts/meta` — column/filter metadata. Requires `Blog.Posts.Read`. */
export async function getPostsQueryMeta(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly signal?: AbortSignal }
): Promise<QueryMetadata> {
  return getQueryMeta(client, `${basePath}/posts`, options);
}
