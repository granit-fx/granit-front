'use client';

import { getPage, getPageTree, listPageVersions, listPages } from '@granit/cms';
import { useQuery } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type {
  ListPagesParams,
  PageResponse,
  PageTreeNodeResponse,
  PageVersionSummaryResponse,
} from '@granit/cms';
import type { PagedResult } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

export function usePageTree(
  siteId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<readonly PageTreeNodeResponse[]> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.pages.tree(queryKeyPrefix, siteId),
    queryFn: () => getPageTree(client, basePath, siteId),
    enabled: (options?.enabled ?? true) && siteId.length > 0,
  });
}

export function usePages(
  params?: ListPagesParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResult<PageResponse>> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.pages.list(queryKeyPrefix, params),
    queryFn: ({ signal }) => listPages(client, basePath, params, { signal }),
    enabled: options?.enabled ?? true,
  });
}

export function usePage(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PageResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.pages.detail(queryKeyPrefix, id),
    queryFn: () => getPage(client, basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

export function usePageVersions(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<readonly PageVersionSummaryResponse[]> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.pages.versions(queryKeyPrefix, id),
    queryFn: () => listPageVersions(client, basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
