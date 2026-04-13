import { useMutation, useQueryClient } from '@tanstack/react-query';

import { permissionKeys } from './use-permissions.js';

import type { PermissionGrantParams, UsePermissionGrantOptions } from '@granit/authorization';
import type { UseMutationResult } from '@tanstack/react-query';

const DEFAULT_BASE_PATH = '/api/v1/authorization';

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

  const buildUrl = ({ roleName, permissionName }: PermissionGrantParams) =>
    `${basePath}/roles/${encodeURIComponent(roleName)}/${encodeURIComponent(permissionName)}`;

  const invalidateRole = (params: PermissionGrantParams) =>
    queryClient.invalidateQueries({ queryKey: permissionKeys.role(params.roleName) });

  const grant = useMutation({
    mutationFn: async (params: PermissionGrantParams) => {
      await client.put(buildUrl(params));
    },
    onSuccess: (_data, params) => invalidateRole(params),
  });

  const revoke = useMutation({
    mutationFn: async (params: PermissionGrantParams) => {
      await client.delete(buildUrl(params));
    },
    onSuccess: (_data, params) => invalidateRole(params),
  });

  return { grant, revoke };
}
