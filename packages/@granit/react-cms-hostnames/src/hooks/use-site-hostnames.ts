import { checkSiteHostnameAvailability, listSiteHostnames } from '@granit/cms-hostnames';
import { useQuery } from '@tanstack/react-query';

import { logger } from '../logger';
import { useCmsHostnamesConfig } from '../providers/cms-hostnames-provider';

import { cmsHostnamesKeys } from './query-keys';

import type { SiteHostnameAvailabilityResponse, SiteHostnameResponse } from '@granit/cms-hostnames';
import type { UseQueryResult } from '@tanstack/react-query';

export function useSiteHostnames(
  siteId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<readonly SiteHostnameResponse[]> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  return useQuery({
    queryKey: cmsHostnamesKeys.list(queryKeyPrefix, siteId),
    queryFn: async () => {
      logger.debug('Fetching site hostnames', { siteId });
      const hostnames = await listSiteHostnames(client, basePath, siteId);
      logger.debug('Loaded site hostnames', { siteId, count: hostnames.length });
      return hostnames;
    },
    enabled: (options?.enabled ?? true) && siteId.length > 0,
  });
}

export function useSiteHostnameAvailability(
  siteId: string,
  host: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<SiteHostnameAvailabilityResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  return useQuery({
    queryKey: cmsHostnamesKeys.availability(queryKeyPrefix, siteId, host),
    queryFn: () => checkSiteHostnameAvailability(client, basePath, siteId, host),
    enabled: (options?.enabled ?? true) && siteId.length > 0 && host.length > 0,
    staleTime: 10_000,
    gcTime: 30_000,
  });
}
