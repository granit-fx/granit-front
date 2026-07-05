'use client';

import { getAuthor, listAuthors } from '@granit/blog';
import { useQuery } from '@tanstack/react-query';

import { useBlogConfig } from '../providers/blog-provider';

import { blogKeys } from './query-keys';

import type { BlogAuthorProfileResponse } from '@granit/blog';
import type { UseQueryResult } from '@tanstack/react-query';

/** All author profiles for a site. Requires `Blog.Authors.Read`. */
export function useAuthors(
  siteId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<readonly BlogAuthorProfileResponse[]> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  return useQuery({
    queryKey: blogKeys.authors.list(queryKeyPrefix, siteId),
    queryFn: ({ signal }) => listAuthors(client, basePath, siteId, { signal }),
    enabled: (options?.enabled ?? true) && siteId.length > 0,
    staleTime: 30_000,
  });
}

/** A single author profile by id. Requires `Blog.Authors.Read`. */
export function useAuthor(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<BlogAuthorProfileResponse> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  return useQuery({
    queryKey: blogKeys.authors.detail(queryKeyPrefix, id),
    queryFn: () => getAuthor(client, basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
