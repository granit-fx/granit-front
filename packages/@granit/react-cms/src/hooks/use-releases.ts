'use client';

import { getRelease, listReleases } from '@granit/cms';
import { useQuery } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type { ListReleasesParams, ReleaseResponse } from '@granit/cms';
import type { PagedResult } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

export function useReleases(
  params?: ListReleasesParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResult<ReleaseResponse>> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.releases.list(queryKeyPrefix, params),
    queryFn: () => listReleases(client, basePath, params),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useRelease(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<ReleaseResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.releases.detail(queryKeyPrefix, id),
    queryFn: () => getRelease(client, basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
