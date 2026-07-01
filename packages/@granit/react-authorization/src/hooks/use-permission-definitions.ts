import { listPermissionDefinitions } from '@granit/authorization';
import { useQuery } from '@tanstack/react-query';

import { buildPermissionQueryKey } from './query-keys';
import { useResolvedAuthorizationConfig } from './use-authorization-config';

import type { UsePermissionDefinitionsOptions } from '../types';
import type { PermissionGroupResponse } from '@granit/authorization';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches all permission definitions grouped by module.
 *
 * Calls `GET {basePath}/permissions/definitions` (default `/api/v1/authorization/permissions/definitions`) and returns
 * the full permission tree used for admin UIs (role-permission matrix).
 *
 * @param options - Optional configuration (`basePath`, `enabled`, `queryKeyPrefix`). The Axios client is resolved from the nearest `<AuthorizationProvider>`.
 * @returns Standard React Query result with permission groups.
 *
 * @example
 * ```tsx
 * const { data: groups, isLoading } = usePermissionDefinitions();
 *
 * if (isLoading) return <Spinner />;
 * return groups?.map(g => <PermissionGroup key={g.name} group={g} />);
 * ```
 */
export function usePermissionDefinitions(
  options: UsePermissionDefinitionsOptions = {}
): UseQueryResult<PermissionGroupResponse[]> {
  const { enabled } = options;
  const config = useResolvedAuthorizationConfig(options);

  return useQuery({
    queryKey: buildPermissionQueryKey(config, 'definitions'),
    queryFn: () => listPermissionDefinitions(config.client, config.basePath),
    enabled: enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}
