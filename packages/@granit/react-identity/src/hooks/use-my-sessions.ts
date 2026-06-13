import {
  listMyUserDevices,
  listMyUserSessions,
  revokeMyOtherUserSessions,
  revokeMyUserSession,
} from '@granit/identity';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider';

import type {
  UserDeviceResponse,
  UserSessionId,
  UserSessionResponse,
  UserSessionsRevokedResponse,
} from '@granit/identity';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Self-service session/device hooks — the caller's OWN sessions and devices,
// the canonical replacement for the removed `/bff/sessions` surface. No
// userId: the backend scopes to the authenticated caller.
// ---------------------------------------------------------------------------

/**
 * List the caller's own active sessions (`GET /sessions`).
 *
 * @example
 * ```tsx
 * const { data: sessions } = useMyUserSessions();
 * ```
 */
export function useMyUserSessions(): UseQueryResult<readonly UserSessionResponse[]> {
  const config = useIdentityConfig();
  const basePath = config.sessionsBasePath;

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'me', 'sessions'),
    queryFn: () => listMyUserSessions(config.client, basePath),
  });
}

/**
 * List the caller's own devices (`GET /devices`).
 *
 * @example
 * ```tsx
 * const { data: devices } = useMyUserDevices();
 * ```
 */
export function useMyUserDevices(): UseQueryResult<readonly UserDeviceResponse[]> {
  const config = useIdentityConfig();
  const basePath = config.sessionsBasePath;

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'me', 'devices'),
    queryFn: () => listMyUserDevices(config.client, basePath),
  });
}

/**
 * Revoke one of the caller's own sessions by ID (`DELETE /sessions/{sessionId}`).
 * Invalidates the caller's session and device queries on success.
 *
 * @example
 * ```tsx
 * const revoke = useRevokeMyUserSession();
 * await revoke.mutateAsync(sessionId);
 * ```
 */
export function useRevokeMyUserSession(): UseMutationResult<void, Error, UserSessionId> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.sessionsBasePath;

  return useMutation({
    mutationFn: (sessionId: UserSessionId) =>
      revokeMyUserSession(config.client, basePath, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildIdentityQueryKey(config, 'me') });
    },
  });
}

/**
 * Revoke all of the caller's sessions except the current one — "log out
 * everywhere else" (`DELETE /sessions`). Resolves to the number of sessions
 * revoked and invalidates the caller's session and device queries on success.
 *
 * @example
 * ```tsx
 * const revokeOthers = useRevokeMyOtherUserSessions();
 * const { revokedCount } = await revokeOthers.mutateAsync();
 * ```
 */
export function useRevokeMyOtherUserSessions(): UseMutationResult<
  UserSessionsRevokedResponse,
  Error,
  void
> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.sessionsBasePath;

  return useMutation({
    mutationFn: () => revokeMyOtherUserSessions(config.client, basePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildIdentityQueryKey(config, 'me') });
    },
  });
}
