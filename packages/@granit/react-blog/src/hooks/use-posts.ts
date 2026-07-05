'use client';

import { getPost, getPostsQueryMeta, listPosts } from '@granit/blog';
import { useQuery } from '@tanstack/react-query';

import { logger } from '../logger';
import { useBlogConfig } from '../providers/blog-provider';

import { blogKeys } from './query-keys';

import type { BlogPostListItemResponse, BlogPostResponse, ListBlogPostsParams } from '@granit/blog';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

/** Admin posts list (QueryEngine, `GET /posts`). Requires `Blog.Posts.Read`. */
export function usePosts(
  params?: ListBlogPostsParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResult<BlogPostListItemResponse>> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  return useQuery({
    queryKey: blogKeys.posts.list(queryKeyPrefix, params),
    queryFn: async ({ signal }) => {
      logger.debug('fetching posts list', { params });
      const page = await listPosts(client, basePath, params, { signal });
      logger.debug('posts list loaded', { count: page.items.length });
      return page;
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

/** Column / filter metadata for the posts list. Static per deployment. */
export function usePostsQueryMeta(options?: {
  readonly enabled?: boolean;
}): UseQueryResult<QueryMetadata> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  return useQuery({
    queryKey: blogKeys.posts.queryMeta(queryKeyPrefix),
    queryFn: ({ signal }) => getPostsQueryMeta(client, basePath, { signal }),
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
