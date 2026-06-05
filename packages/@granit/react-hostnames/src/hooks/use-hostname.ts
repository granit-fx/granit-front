import { checkAvailability, getHostname } from '@granit/hostnames';
import { useQuery } from '@tanstack/react-query';

import { useHostnamesConfig } from '../providers/hostnames-provider';

import { hostnamesKeys } from './query-keys';

import type { HostnameAvailabilityResponse, ManagedHostnameResponse } from '@granit/hostnames';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches a single managed hostname by ID.
 *
 * The query is disabled when `id` is empty.
 *
 * @example
 * ```tsx
 * const { data: hostname } = useHostname('11111111-0001-4000-a000-000000000001');
 * ```
 */
export function useHostname(id: string): UseQueryResult<ManagedHostnameResponse> {
  const { client, basePath } = useHostnamesConfig();

  return useQuery({
    queryKey: hostnamesKeys.hostname(id),
    queryFn: () => getHostname(client, basePath, id),
    enabled: id.length > 0,
  });
}

/**
 * Query hook that checks whether a hostname is available.
 *
 * The query is disabled when `host` is empty.
 *
 * @example
 * ```tsx
 * const { data } = useCheckAvailability('new.example.com');
 * if (data?.isAvailable) { ... }
 * ```
 */
export function useCheckAvailability(host: string): UseQueryResult<HostnameAvailabilityResponse> {
  const { client, basePath } = useHostnamesConfig();

  return useQuery({
    queryKey: hostnamesKeys.availability(host),
    queryFn: () => checkAvailability(client, basePath, host),
    enabled: host.length > 0,
  });
}
