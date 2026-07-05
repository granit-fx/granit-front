import { getPage, getQueryMeta } from '@granit/query-engine';

import type { BlogPostGridRow, ListBlogPostsParams } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';

/**
 * `GET {basePath}/grid` — QueryEngine grid over posts (filter/sort/paginate/export),
 * projecting {@link BlogPostGridRow}. Requires `Blog.Posts.Read`.
 */
export async function listPostsGrid(
  client: AxiosInstance,
  basePath: string,
  params?: ListBlogPostsParams,
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<BlogPostGridRow>> {
  return getPage<BlogPostGridRow>(client, `${basePath}/grid`, params ?? {}, options);
}

/** `GET {basePath}/grid` metadata (columns/filters). Requires `Blog.Posts.Read`. */
export async function getPostsGridMeta(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly signal?: AbortSignal }
): Promise<QueryMetadata> {
  return getQueryMeta(client, `${basePath}/grid`, options);
}
