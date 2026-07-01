import { grantPermission, revokePermission } from '@granit/authorization';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buildPermissionQueryKey } from './query-keys';
import { useResolvedAuthorizationConfig } from './use-authorization-config';

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
 * @param options - Optional configuration (`basePath`, `queryKeyPrefix`). The Axios client is resolved from the nearest `<AuthorizationProvider>`.
 * @returns Object with `grant` and `revoke` mutation results.
 *
 * @example
 * ```tsx
 * const { grant, revoke } = usePermissionGrant();
 *
 * // Grant
 * grant.mutate({ roleName: 'editor', permissionName: 'Invoices.Create' });
 *
 * // Revoke
 * revoke.mutate({ roleName: 'editor', permissionName: 'Invoices.Delete' });
 * ```
 */
export function usePermissionGrant(
  options: UsePermissionGrantOptions = {}
): UsePermissionGrantReturn {
  const config = useResolvedAuthorizationConfig(options);
  const queryClient = useQueryClient();

  const invalidateRole = (params: PermissionGrantParams) => {
    queryClient.invalidateQueries({
      queryKey: buildPermissionQueryKey(config, 'roles', params.roleName),
    });
    queryClient.invalidateQueries({
      queryKey: buildPermissionQueryKey(config, 'grants'),
    });
  };

  const grant = useMutation({
    mutationFn: (params: PermissionGrantParams) =>
      grantPermission(config.client, config.basePath, params),
    onSuccess: (_data, params) => invalidateRole(params),
  });

  const revoke = useMutation({
    mutationFn: (params: PermissionGrantParams) =>
      revokePermission(config.client, config.basePath, params),
    onSuccess: (_data, params) => invalidateRole(params),
  });

  return { grant, revoke };
}
