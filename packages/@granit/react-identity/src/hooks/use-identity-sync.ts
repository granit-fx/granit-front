import { syncAllUsers, syncStaleUsers, syncUsers } from '@granit/identity';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider';

import type {
  IdentityUser,
  IdentityUserCacheSyncAllResult,
  IdentityUserCacheSyncStaleResult,
} from '@granit/identity';
import type { UserId } from '@granit/types';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Returns mutations for synchronizing the identity user cache.
 *
 * - `sync` — sync specific user IDs (resolves to the refreshed records), invalidates user list queries
 * - `syncAll` — full sync of all identity provider users, invalidates all identity queries
 * - `syncStale` — sync stale entries only, invalidates user list queries
 *
 * @example
 * ```tsx
 * const { sync, syncAll, syncStale } = useIdentitySync();
 * await syncAll.mutateAsync();
 * await sync.mutateAsync(['user-1', 'user-2']);
 * await syncStale.mutateAsync();
 * ```
 */
export function useIdentitySync(): {
  sync: UseMutationResult<readonly IdentityUser[], Error, UserId[]>;
  syncAll: UseMutationResult<IdentityUserCacheSyncAllResult, Error, void>;
  syncStale: UseMutationResult<IdentityUserCacheSyncStaleResult, Error, void>;
} {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath;

  const sync = useMutation({
    mutationFn: (userIds: UserId[]) => syncUsers(config.client, basePath, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'users'),
      });
    },
  });

  const syncAll = useMutation({
    mutationFn: () => syncAllUsers(config.client, basePath),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'users'),
      });
    },
  });

  const syncStale = useMutation({
    mutationFn: () => syncStaleUsers(config.client, basePath),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'users'),
      });
    },
  });

  return { sync, syncAll, syncStale };
}
