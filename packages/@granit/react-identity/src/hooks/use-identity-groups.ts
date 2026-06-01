import { addUserToGroup, listGroups, listUserGroups, removeUserFromGroup } from '@granit/identity';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider';

import type { IdentityGroup } from '@granit/identity';
import type { UserId } from '@granit/types';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * List all groups from the identity provider.
 *
 * @example
 * ```tsx
 * const { data: groups } = useGroups();
 * ```
 */
export function useGroups(): UseQueryResult<readonly IdentityGroup[]> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath;

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'provider', 'groups'),
    queryFn: () => listGroups(config.client, basePath),
  });
}

/**
 * List groups a user belongs to.
 *
 * The query is automatically disabled when `userId` is empty.
 *
 * @example
 * ```tsx
 * const { data: groups } = useUserGroups(selectedUserId);
 * ```
 */
export function useUserGroups(userId: UserId): UseQueryResult<readonly IdentityGroup[]> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath;

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'provider', 'users', userId, 'groups'),
    queryFn: () => listUserGroups(config.client, basePath, userId),
    enabled: userId.length > 0,
  });
}

/** Variables for `useAddUserToGroup` and `useRemoveUserFromGroup` mutations. */
export type GroupMutationVariables = {
  readonly userId: UserId;
  readonly groupId: string;
};

/**
 * Add a user to a group (idempotent).
 * Invalidates group and user queries on success.
 *
 * @example
 * ```tsx
 * const addToGroup = useAddUserToGroup();
 * await addToGroup.mutateAsync({ userId: 'user-1', groupId: 'group-1' });
 * ```
 */
export function useAddUserToGroup(): UseMutationResult<void, Error, GroupMutationVariables> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.providerBasePath;

  return useMutation({
    mutationFn: ({ userId, groupId }: GroupMutationVariables) =>
      addUserToGroup(config.client, basePath, userId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'groups'),
      });
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'users'),
      });
    },
  });
}

/**
 * Remove a user from a group (idempotent).
 * Invalidates group and user queries on success.
 *
 * @example
 * ```tsx
 * const removeFromGroup = useRemoveUserFromGroup();
 * await removeFromGroup.mutateAsync({ userId: 'user-1', groupId: 'group-1' });
 * ```
 */
export function useRemoveUserFromGroup(): UseMutationResult<void, Error, GroupMutationVariables> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.providerBasePath;

  return useMutation({
    mutationFn: ({ userId, groupId }: GroupMutationVariables) =>
      removeUserFromGroup(config.client, basePath, userId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'groups'),
      });
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'users'),
      });
    },
  });
}
