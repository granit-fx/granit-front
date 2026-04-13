import {
  assignRole,
  fetchRoleMembers,
  fetchRoles,
  fetchUserRoles,
  removeRole,
} from '@granit/identity';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider.js';

import type { IdentityRole, IdentityUser } from '@granit/identity';
import type { UserId } from '@granit/types';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * List all roles from the identity provider.
 *
 * @example
 * ```tsx
 * const { data: roles } = useRoles();
 * ```
 */
export function useRoles(): UseQueryResult<readonly IdentityRole[]> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath ?? '/api/v1/identity/provider';

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'provider', 'roles'),
    queryFn: () => fetchRoles(config.client, basePath),
  });
}

/**
 * List roles assigned to a user.
 *
 * The query is automatically disabled when `userId` is empty.
 *
 * @example
 * ```tsx
 * const { data: roles } = useUserRoles(selectedUserId);
 * ```
 */
export function useUserRoles(userId: UserId): UseQueryResult<readonly IdentityRole[]> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath ?? '/api/v1/identity/provider';

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'provider', 'users', userId, 'roles'),
    queryFn: () => fetchUserRoles(config.client, basePath, userId),
    enabled: userId.length > 0,
  });
}

/**
 * List members of a role.
 *
 * The query is automatically disabled when `roleName` is empty.
 *
 * @example
 * ```tsx
 * const { data: members } = useRoleMembers('admin');
 * ```
 */
export function useRoleMembers(roleName: string): UseQueryResult<readonly IdentityUser[]> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath ?? '/api/v1/identity/provider';

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'provider', 'roles', roleName, 'members'),
    queryFn: () => fetchRoleMembers(config.client, basePath, roleName),
    enabled: roleName.length > 0,
  });
}

/** Variables for `useAssignRole` and `useRemoveRole` mutations. */
export type RoleMutationVariables = {
  readonly userId: UserId;
  readonly roleName: string;
};

/**
 * Assign a role to a user (idempotent).
 * Invalidates role and user queries on success.
 *
 * @example
 * ```tsx
 * const assign = useAssignRole();
 * await assign.mutateAsync({ userId: 'user-1', roleName: 'admin' });
 * ```
 */
export function useAssignRole(): UseMutationResult<void, Error, RoleMutationVariables> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.providerBasePath ?? '/api/v1/identity/provider';

  return useMutation({
    mutationFn: ({ userId, roleName }: RoleMutationVariables) =>
      assignRole(config.client, basePath, userId, roleName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'roles'),
      });
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'users'),
      });
    },
  });
}

/**
 * Remove a role from a user (idempotent).
 * Invalidates role and user queries on success.
 *
 * @example
 * ```tsx
 * const remove = useRemoveRole();
 * await remove.mutateAsync({ userId: 'user-1', roleName: 'admin' });
 * ```
 */
export function useRemoveRole(): UseMutationResult<void, Error, RoleMutationVariables> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.providerBasePath ?? '/api/v1/identity/provider';

  return useMutation({
    mutationFn: ({ userId, roleName }: RoleMutationVariables) =>
      removeRole(config.client, basePath, userId, roleName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'roles'),
      });
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'users'),
      });
    },
  });
}
