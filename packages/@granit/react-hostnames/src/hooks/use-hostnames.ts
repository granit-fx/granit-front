import { listHostnames } from '@granit/hostnames';
import { useQuery } from '@tanstack/react-query';

import { useHostnamesConfig } from '../providers/hostnames-provider';

import { hostnamesKeys } from './query-keys';

import type { ListHostnamesParams, ManagedHostnameResponse, PagedResponse } from '@granit/hostnames';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Query hook that fetches a paginated list of managed hostnames.
 *
 * @example
 * ```tsx
 * const { data } = useHostnames({ page: 0, pageSize: 20, ownerType: 'cms.site' });
 * ```
 */
export function useHostnames(
  params?: ListHostnamesParams
): UseQueryResult<PagedResponse<ManagedHostnameResponse>> {
  const { client, basePath } = useHostnamesConfig();

  return useQuery({
    queryKey: hostnamesKeys.list(params),
    queryFn: () => listHostnames(client, basePath, params),
  });
}
