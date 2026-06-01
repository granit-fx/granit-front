import { getUserById, searchUsers } from '@granit/identity';
import { useQuery } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider';

import type { IdentityUser, IdentityUserListParams, IdentityUserPage } from '@granit/identity';
import type { UserId } from '@granit/types';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Search cached identity users with optional filtering and pagination.
 *
 * @example
 * ```tsx
 * const { data } = useIdentityUsers({ search: 'john', page: 1 });
 * data?.items.map(user => <span key={user.userId}>{user.username}</span>);
 * ```
 */
export function useIdentityUsers(
  params?: IdentityUserListParams
): UseQueryResult<IdentityUserPage> {
  const config = useIdentityConfig();

  return useQuery({
    queryKey: [...buildIdentityQueryKey(config, 'users', 'list'), params],
    queryFn: () => searchUsers(config.client, config.basePath, params),
  });
}

/**
 * Fetch a single cached identity user by ID.
 *
 * The query is automatically disabled when `userId` is empty.
 *
 * @example
 * ```tsx
 * const { data: user } = useIdentityUser(selectedUserId);
 * if (user) {
 *   console.log(user.email);
 * }
 * ```
 */
export function useIdentityUser(userId: UserId): UseQueryResult<IdentityUser> {
  const config = useIdentityConfig();

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'users', userId),
    queryFn: () => getUserById(config.client, config.basePath, userId),
    enabled: userId.length > 0,
  });
}
