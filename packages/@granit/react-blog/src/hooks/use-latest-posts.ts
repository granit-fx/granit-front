'use client';

import { resolveBlockData } from '@granit/cms';
import { useQuery } from '@tanstack/react-query';

import { BLOG_LATEST_POSTS_DATA_SOURCE_KEY } from '../constants';
import { useBlogConfig } from '../providers/blog-provider';

import type { BlogLatestPostsData } from '@granit/blog';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Resolves the data-bound `blog-latest-posts` block via the shared CMS block-data
 * endpoint (`POST {cmsBasePath}/blocks/data`, `dataSourceKey: 'blog.latest-posts'`).
 * Mirrors how CMS resolves data-bound blocks — the same seam Puck's `resolveData`
 * uses at render time.
 */
export function useBlogLatestPosts(
  params: { readonly siteId: string; readonly culture: string; readonly query?: string | null },
  options?: { readonly enabled?: boolean }
): UseQueryResult<BlogLatestPostsData> {
  const { client, cmsBasePath, queryKeyPrefix } = useBlogConfig();
  return useQuery({
    queryKey: [...queryKeyPrefix, 'blocks', BLOG_LATEST_POSTS_DATA_SOURCE_KEY, params] as const,
    queryFn: async () => {
      const response = await resolveBlockData(client, cmsBasePath, {
        dataSourceKey: BLOG_LATEST_POSTS_DATA_SOURCE_KEY,
        query: params.query ?? null,
        siteId: params.siteId,
        culture: params.culture,
      });
      return response.data as BlogLatestPostsData;
    },
    enabled: (options?.enabled ?? true) && params.siteId.length > 0 && params.culture.length > 0,
    staleTime: 60_000,
  });
}
