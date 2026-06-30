'use client';

import { getRelease, getReleasesMeta, listReleases } from '@granit/cms';
import { useQuery } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type { ListReleasesParams, ReleaseResponse } from '@granit/cms';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

export function useReleases(
  params?: ListReleasesParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResult<ReleaseResponse>> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.releases.list(queryKeyPrefix, params),
    queryFn: ({ signal }) => listReleases(client, basePath, params, { signal }),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

/** Column / filter / preset metadata for the releases admin grid. Static per deployment. */
export function useReleasesMeta(options?: {
  readonly enabled?: boolean;
}): UseQueryResult<QueryMetadata> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.releases.meta(queryKeyPrefix),
    queryFn: ({ signal }) => getReleasesMeta(client, basePath, { signal }),
    staleTime: Infinity,
    enabled: options?.enabled ?? true,
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
