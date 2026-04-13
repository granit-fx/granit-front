import { useQuery } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { permissionKeys } from './use-permissions.js';

import type { PermissionGrantDto, UseRolePermissionsOptions } from '@granit/authorization';
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
): UseQueryResult<PermissionGrantDto> {
  const { client, roleName, basePath = DEFAULT_BASE_PATH, enabled } = options;

  return useQuery({
    queryKey: permissionKeys.role(roleName),
    queryFn: async () => {
      const response = await client.get<PermissionGrantDto>(
        `${basePath}/roles/${encodeURIComponent(roleName)}`
      );
      return response.data;
    },
    enabled: enabled ?? true,
  });
}
