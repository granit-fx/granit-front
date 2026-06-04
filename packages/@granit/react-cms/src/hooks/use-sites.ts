'use client';

import { getSite, listSites } from '@granit/cms';
import { useQuery } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type { ListSitesParams, PagedResponse, SiteResponse } from '@granit/cms';
import type { UseQueryResult } from '@tanstack/react-query';

export function useSites(
  params?: ListSitesParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResponse<SiteResponse>> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.sites.list(queryKeyPrefix, params),
    queryFn: () => listSites(client, basePath, params),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useSite(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<SiteResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.sites.detail(queryKeyPrefix, id),
    queryFn: () => getSite(client, basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
