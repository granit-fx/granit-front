import { eraseUserCache, pseudonymizeUserCache } from '@granit/identity';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider';

import type { UserId } from '@granit/types';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Returns mutations for GDPR-related identity cache operations.
 *
 * - `erase` — hard-delete a user's cached data (Art. 17)
 * - `pseudonymize` — replace a user's cached PII with anonymized placeholders (Art. 18)
 *
 * Both invalidate user queries on success.
 *
 * @example
 * ```tsx
 * const { erase, pseudonymize } = useIdentityRgpd();
 * await erase.mutateAsync('user-id');
 * await pseudonymize.mutateAsync('user-id');
 * ```
 */
export function useIdentityRgpd(): {
  erase: UseMutationResult<void, Error, UserId>;
  pseudonymize: UseMutationResult<void, Error, UserId>;
} {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath;

  const invalidateUsers = () =>
    queryClient.invalidateQueries({
      queryKey: buildIdentityQueryKey(config, 'users'),
    });

  const erase = useMutation({
    mutationFn: (userId: UserId) => eraseUserCache(config.client, basePath, userId),
    onSuccess: invalidateUsers,
  });

  const pseudonymize = useMutation({
    mutationFn: (userId: UserId) => pseudonymizeUserCache(config.client, basePath, userId),
    onSuccess: invalidateUsers,
  });

  return { erase, pseudonymize };
}
