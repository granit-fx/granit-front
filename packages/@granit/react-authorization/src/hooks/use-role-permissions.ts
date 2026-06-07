import { getRolePermissions } from '@granit/authorization';
import { useQuery } from '@tanstack/react-query';

import { buildPermissionQueryKey } from './query-keys';
import { useResolvedAuthorizationConfig } from './use-authorization-config';

import type { UseRolePermissionsOptions } from '../types';
import type { PermissionGrantResponse } from '@granit/authorization';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches the permissions granted to a specific role.
 *
 * Calls `GET {basePath}/roles/{roleName}` (default `/api/v1/authorization/roles/{roleName}`)
 * and returns the list of granted permission names.
 *
 * @param options - Axios client, role name, and optional configuration.
 * @returns Standard React Query result with the role's permission grant.
 *
 * @example
 * ```tsx
 * const { data: grant, isLoading } = useRolePermissions({
 *   client: api,
 *   roleName: 'admin',
 * });
 *
 * if (isLoading) return <Spinner />;
 * return <p>{grant?.permissions.length} permissions</p>;
 * ```
 */
export function useRolePermissions(
  options: UseRolePermissionsOptions
): UseQueryResult<PermissionGrantResponse> {
  const { roleName, enabled } = options;
  const config = useResolvedAuthorizationConfig(options);

  return useQuery({
    queryKey: buildPermissionQueryKey(config, 'roles', roleName),
    queryFn: () => getRolePermissions(config.client, config.basePath, roleName),
    enabled: enabled ?? true,
  });
}
