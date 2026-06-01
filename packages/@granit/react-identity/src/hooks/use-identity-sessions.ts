import {
  getUserDeviceActivity,
  listUserSessions,
  terminateAllSessions,
  terminateSession,
} from '@granit/identity';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider';

import type { IdentityDeviceActivity, IdentitySession, IdentitySessionId } from '@granit/identity';
import type { UserId } from '@granit/types';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * List active sessions for a user.
 *
 * The query is automatically disabled when `userId` is empty.
 *
 * @example
 * ```tsx
 * const { data: sessions } = useUserSessions(selectedUserId);
 * ```
 */
export function useUserSessions(userId: UserId): UseQueryResult<readonly IdentitySession[]> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath;

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'provider', 'users', userId, 'sessions'),
    queryFn: () => listUserSessions(config.client, basePath, userId),
    enabled: userId.length > 0,
  });
}

/**
 * Get device activity for a user.
 *
 * The query is automatically disabled when `userId` is empty.
 *
 * @example
 * ```tsx
 * const { data: devices } = useUserDeviceActivity(selectedUserId);
 * ```
 */
export function useUserDeviceActivity(
  userId: UserId
): UseQueryResult<readonly IdentityDeviceActivity[]> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath;

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'provider', 'users', userId, 'devices'),
    queryFn: () => getUserDeviceActivity(config.client, basePath, userId),
    enabled: userId.length > 0,
  });
}

/** Variables for `useTerminateSession` mutation. */
export type TerminateSessionVariables = {
  readonly userId: UserId;
  readonly sessionId: IdentitySessionId;
};

/**
 * Terminate a specific user session.
 * May fail with 501 if `supportsIndividualSessionTermination` is false.
 * Invalidates session queries on success.
 *
 * @example
 * ```tsx
 * const terminate = useTerminateSession();
 * await terminate.mutateAsync({ userId: 'user-1', sessionId: 'session-1' });
 * ```
 */
export function useTerminateSession(): UseMutationResult<void, Error, TerminateSessionVariables> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.providerBasePath;

  return useMutation({
    mutationFn: ({ userId, sessionId }: TerminateSessionVariables) =>
      terminateSession(config.client, basePath, userId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'users'),
      });
    },
  });
}

/**
 * Terminate all active sessions for a user.
 * Invalidates session queries on success.
 *
 * @example
 * ```tsx
 * const terminateAll = useTerminateAllSessions();
 * await terminateAll.mutateAsync('user-1');
 * ```
 */
export function useTerminateAllSessions(): UseMutationResult<void, Error, UserId> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.providerBasePath;

  return useMutation({
    mutationFn: (userId: UserId) => terminateAllSessions(config.client, basePath, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'users'),
      });
    },
  });
}
