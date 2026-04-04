import { batchResolveUsers, getCacheStats } from '@granit/identity';
import { useMutation, useQuery } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider.js';

import type { IdentityUser, IdentityUserCacheStats } from '@granit/identity';
import type { UserId } from '@granit/types';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch identity user cache statistics (total entries, stale entries, sync timestamps).
 *
 * @example
 * ```tsx
 * const { data: stats } = useIdentityCacheStats();
 * if (stats) {
 *   console.log(`${stats.staleEntries} stale of ${stats.totalEntries}`);
 * }
 * ```
 */
export function useIdentityCacheStats(): UseQueryResult<IdentityUserCacheStats> {
  const config = useIdentityConfig();

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'cache-stats'),
    queryFn: () => getCacheStats(config.client, config.basePath ?? '/identity/users'),
  });
}

/**
 * Resolve multiple users by their IDs in a single batch request.
 *
 * @example
 * ```tsx
 * const { mutateAsync: resolve } = useBatchResolveUsers();
 * const users = await resolve(['user-1', 'user-2']);
 * ```
 */
export function useBatchResolveUsers(): UseMutationResult<
  readonly IdentityUser[],
  Error,
  UserId[]
> {
  const config = useIdentityConfig();

  return useMutation({
    mutationFn: (userIds: UserId[]) =>
      batchResolveUsers(config.client, config.basePath ?? '/identity/users', userIds),
  });
}
