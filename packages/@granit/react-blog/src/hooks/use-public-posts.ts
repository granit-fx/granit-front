'use client';

import { getPublicPostBySlug, getPublicPosts } from '@granit/blog';
import { useQuery } from '@tanstack/react-query';

import { useBlogConfig } from '../providers/blog-provider';

import { blogKeys } from './query-keys';

import type {
  BlogPostListResponse,
  BlogPostPublishedResponse,
  ListPublicPostsParams,
} from '@granit/blog';
import type { UseQueryResult } from '@tanstack/react-query';

/** Published posts list/archive for the current site (anonymous). */
export function usePublicPosts(
  params?: ListPublicPostsParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<BlogPostListResponse> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  return useQuery({
    queryKey: blogKeys.publicPosts.list(queryKeyPrefix, params),
    queryFn: () => getPublicPosts(client, basePath, params),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}

/**
 * A single published post by slug (anonymous). Resolves to `null` when the post
 * is missing, unpublished, or absent in the requested culture.
 */
export function usePublicPost(
  slug: string,
  culture?: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<BlogPostPublishedResponse | null> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  return useQuery({
    queryKey: blogKeys.publicPosts.detail(queryKeyPrefix, slug, culture),
    queryFn: () => getPublicPostBySlug(client, basePath, slug, culture),
    enabled: (options?.enabled ?? true) && slug.length > 0,
    staleTime: 60_000,
  });
}
