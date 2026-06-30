'use client';

import { getSite, getSitesMeta, listSites } from '@granit/cms';
import { useQuery } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type { ListSitesParams, SiteResponse } from '@granit/cms';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

export function useSites(
  params?: ListSitesParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResult<SiteResponse>> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.sites.list(queryKeyPrefix, params),
    queryFn: ({ signal }) => listSites(client, basePath, params, { signal }),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

/** Column / filter / preset metadata for the sites admin grid. Static per deployment. */
export function useSitesMeta(options?: {
  readonly enabled?: boolean;
}): UseQueryResult<QueryMetadata> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.sites.meta(queryKeyPrefix),
    queryFn: ({ signal }) => getSitesMeta(client, basePath, { signal }),
    staleTime: Infinity,
    enabled: options?.enabled ?? true,
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
