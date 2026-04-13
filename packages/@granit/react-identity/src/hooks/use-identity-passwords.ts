import {
  fetchPasswordChangedAt,
  sendPasswordResetEmail,
  setTemporaryPassword,
} from '@granit/identity';
import { useMutation, useQuery } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider.js';

import type { IdentityPasswordChangedAtResponse } from '@granit/identity';
import type { UserId } from '@granit/types';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Get the last password change timestamp for a user.
 *
 * The query is automatically disabled when `userId` is empty.
 *
 * @example
 * ```tsx
 * const { data } = usePasswordChangedAt(selectedUserId);
 * console.log(data?.changedAt);
 * ```
 */
export function usePasswordChangedAt(
  userId: UserId
): UseQueryResult<IdentityPasswordChangedAtResponse> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath;

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'provider', 'users', userId, 'password-changed-at'),
    queryFn: () => fetchPasswordChangedAt(config.client, basePath, userId),
    enabled: userId.length > 0,
  });
}

/**
 * Send a password reset email to a user.
 * May fail with 501 if `supportsNativePasswordResetEmail` is false.
 *
 * @example
 * ```tsx
 * const sendReset = useSendPasswordResetEmail();
 * await sendReset.mutateAsync('user-1');
 * ```
 */
export function useSendPasswordResetEmail(): UseMutationResult<void, Error, UserId> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath;

  return useMutation({
    mutationFn: (userId: UserId) => sendPasswordResetEmail(config.client, basePath, userId),
  });
}

/** Variables for `useSetTemporaryPassword` mutation. */
export type SetTemporaryPasswordVariables = {
  readonly userId: UserId;
  readonly password: string;
};

/**
 * Set a temporary password for a user.
 *
 * @example
 * ```tsx
 * const setPassword = useSetTemporaryPassword();
 * await setPassword.mutateAsync({ userId: 'user-1', password: 'temp123!' });
 * ```
 */
export function useSetTemporaryPassword(): UseMutationResult<
  void,
  Error,
  SetTemporaryPasswordVariables
> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath;

  return useMutation({
    mutationFn: ({ userId, password }: SetTemporaryPasswordVariables) =>
      setTemporaryPassword(config.client, basePath, userId, password),
  });
}
