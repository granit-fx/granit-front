'use client';

import { getPost, getPostsGridMeta, listPostsGrid } from '@granit/blog';
import { useQuery } from '@tanstack/react-query';

import { useBlogConfig } from '../providers/blog-provider';

import { blogKeys } from './query-keys';

import type { BlogPostGridRow, BlogPostResponse, ListBlogPostsParams } from '@granit/blog';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

/** Admin posts grid (QueryEngine). Requires `Blog.Posts.Read`. */
export function usePostsGrid(
  params?: ListBlogPostsParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResult<BlogPostGridRow>> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  return useQuery({
    queryKey: blogKeys.posts.grid(queryKeyPrefix, params),
    queryFn: ({ signal }) => listPostsGrid(client, basePath, params, { signal }),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

/** Column / filter metadata for the posts grid. Static per deployment. */
export function usePostsGridMeta(options?: {
  readonly enabled?: boolean;
}): UseQueryResult<QueryMetadata> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  return useQuery({
    queryKey: blogKeys.posts.gridMeta(queryKeyPrefix),
    queryFn: ({ signal }) => getPostsGridMeta(client, basePath, { signal }),
    staleTime: Infinity,
    enabled: options?.enabled ?? true,
  });
}

/** A single post's admin projection by id. Requires `Blog.Posts.Read`. */
export function usePost(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<BlogPostResponse> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  return useQuery({
    queryKey: blogKeys.posts.detail(queryKeyPrefix, id),
    queryFn: () => getPost(client, basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
