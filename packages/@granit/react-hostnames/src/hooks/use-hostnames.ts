import { listHostnames } from '@granit/hostnames';
import { useQuery } from '@tanstack/react-query';

import { useHostnamesConfig } from '../providers/hostnames-provider';

import { hostnamesKeys } from './query-keys';

import type { ListHostnamesParams, ManagedHostnameResponse } from '@granit/hostnames';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches the list of managed hostnames for an owner.
 *
 * `ownerType` and `ownerId` are required by the backend. The query is disabled
 * when either is empty.
 *
 * @example
 * ```tsx
 * const { data: hostnames } = useHostnames({ ownerType: 'cms.site', ownerId: 'owner-id' });
 * ```
 */
export function useHostnames(
  params: ListHostnamesParams
): UseQueryResult<readonly ManagedHostnameResponse[]> {
  const { client, basePath } = useHostnamesConfig();

  return useQuery({
    queryKey: hostnamesKeys.list(params),
    queryFn: () => listHostnames(client, basePath, params),
    enabled: params.ownerType.length > 0 && params.ownerId.length > 0,
  });
}
