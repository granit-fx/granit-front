import { checkSiteHostnameAvailability, listSiteHostnames } from '@granit/cms-hostnames';
import { useQuery } from '@tanstack/react-query';

import { useCmsHostnamesConfig } from '../providers/cms-hostnames-provider';

import { cmsHostnamesKeys } from './query-keys';

import type { CheckAvailabilityResponse, ManagedHostnameResponse } from '@granit/hostnames';
import type { UseQueryResult } from '@tanstack/react-query';

export function useSiteHostnames(
  siteId: string,
  options?: { readonly enabled?: boolean; readonly maxResults?: number }
): UseQueryResult<readonly ManagedHostnameResponse[]> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  return useQuery({
    queryKey: cmsHostnamesKeys.list(queryKeyPrefix, siteId),
    queryFn: () => listSiteHostnames(client, basePath, siteId, { maxResults: options?.maxResults }),
    enabled: (options?.enabled ?? true) && siteId.length > 0,
  });
}

export function useSiteHostnameAvailability(
  siteId: string,
  host: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<CheckAvailabilityResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  return useQuery({
    queryKey: cmsHostnamesKeys.availability(queryKeyPrefix, siteId, host),
    queryFn: () => checkSiteHostnameAvailability(client, basePath, siteId, host),
    enabled: (options?.enabled ?? true) && siteId.length > 0 && host.length > 0,
    staleTime: 10_000,
    gcTime: 30_000,
  });
}
