import { grantPermission, revokePermission } from '@granit/authorization';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants';

import { buildPermissionQueryKey } from './query-keys';

import type { UsePermissionGrantOptions } from '../types';
import type { PermissionGrantParams } from '@granit/authorization';
import type { UseMutationResult } from '@tanstack/react-query';

/** Return type of the {@link usePermissionGrant} hook. */
export type UsePermissionGrantReturn = {
  /** Grant a permission to a role. `PUT {basePath}/roles/{roleName}/{permissionName}` */
  readonly grant: UseMutationResult<void, Error, PermissionGrantParams>;
  /** Revoke a permission from a role. `DELETE {basePath}/roles/{roleName}/{permissionName}` */
  readonly revoke: UseMutationResult<void, Error, PermissionGrantParams>;
};

/**
 * Mutations for granting and revoking individual permissions on a role.
 *
 * Both mutations automatically invalidate the role's permission cache on success.
 *
 * @param options - Axios client and optional base path.
 * @returns Object with `grant` and `revoke` mutation results.
 *
 * @example
 * ```tsx
 * const { grant, revoke } = usePermissionGrant({ client: api });
 *
 * // Grant
 * grant.mutate({ roleName: 'editor', permissionName: 'Invoices.Create' });
 *
 * // Revoke
 * revoke.mutate({ roleName: 'editor', permissionName: 'Invoices.Delete' });
 * ```
 */
export function usePermissionGrant(options: UsePermissionGrantOptions): UsePermissionGrantReturn {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  const invalidateRole = (params: PermissionGrantParams) => {
    // Refresh the role's own grant list and the admin grants query surface.
    queryClient.invalidateQueries({
      queryKey: buildPermissionQueryKey(options, 'roles', params.roleName),
    });
    queryClient.invalidateQueries({
      queryKey: buildPermissionQueryKey(options, 'grants'),
    });
  };

  const grant = useMutation({
    mutationFn: (params: PermissionGrantParams) => grantPermission(client, basePath, params),
    onSuccess: (_data, params) => invalidateRole(params),
  });

  const revoke = useMutation({
    mutationFn: (params: PermissionGrantParams) => revokePermission(client, basePath, params),
    onSuccess: (_data, params) => invalidateRole(params),
  });

  return { grant, revoke };
}
