import { eraseUserCache } from '@granit/identity';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider.js';

import type { UserId } from '@granit/types';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Returns mutations for GDPR-related identity cache operations.
 *
 * - `erase` — hard-delete a user's cached data
 *
 * Invalidates user queries on success.
 *
 * @example
 * ```tsx
 * const { erase } = useIdentityRgpd();
 * await erase.mutateAsync('user-id');
 * ```
 */
export function useIdentityRgpd(): {
  erase: UseMutationResult<void, Error, UserId>;
} {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath ?? '/api/v1/identity/users';

  const erase = useMutation({
    mutationFn: (userId: UserId) => eraseUserCache(config.client, basePath, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'users'),
      });
    },
  });

  return { erase };
}
