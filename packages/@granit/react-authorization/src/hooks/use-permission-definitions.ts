import { listPermissionDefinitions } from '@granit/authorization';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants';

import { buildPermissionQueryKey } from './use-permissions';

import type { PermissionGroupDto, UsePermissionDefinitionsOptions } from '@granit/authorization';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches all permission definitions grouped by module.
 *
 * Calls `GET {basePath}/permissions/definitions` (default `/api/v1/authorization/permissions/definitions`) and returns
 * the full permission tree used for admin UIs (role-permission matrix).
 *
 * @param options - Axios client instance and optional configuration.
 * @returns Standard React Query result with permission groups.
 *
 * @example
 * ```tsx
 * const { data: groups, isLoading } = usePermissionDefinitions({ client: api });
 *
 * if (isLoading) return <Spinner />;
 * return groups?.map(g => <PermissionGroup key={g.name} group={g} />);
 * ```
 */
export function usePermissionDefinitions(
  options: UsePermissionDefinitionsOptions
): UseQueryResult<PermissionGroupDto[]> {
  const { client, basePath = DEFAULT_BASE_PATH, enabled } = options;

  return useQuery({
    queryKey: buildPermissionQueryKey(options, 'definitions'),
    queryFn: () => listPermissionDefinitions(client, basePath),
    enabled: enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}
