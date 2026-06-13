import {
  listMyDevices,
  listMySessions,
  revokeMyOtherSessions,
  revokeMySession,
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
 * const { data: sessions } = useMySessions();
 * ```
 */
export function useMySessions(): UseQueryResult<readonly UserSessionResponse[]> {
  const config = useIdentityConfig();
  const basePath = config.sessionsBasePath;

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'me', 'sessions'),
    queryFn: () => listMySessions(config.client, basePath),
  });
}

/**
 * List the caller's own devices (`GET /devices`).
 *
 * @example
 * ```tsx
 * const { data: devices } = useMyDevices();
 * ```
 */
export function useMyDevices(): UseQueryResult<readonly UserDeviceResponse[]> {
  const config = useIdentityConfig();
  const basePath = config.sessionsBasePath;

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'me', 'devices'),
    queryFn: () => listMyDevices(config.client, basePath),
  });
}

/**
 * Revoke one of the caller's own sessions by ID (`DELETE /sessions/{sessionId}`).
 * Invalidates the caller's session and device queries on success.
 *
 * @example
 * ```tsx
 * const revoke = useRevokeMySession();
 * await revoke.mutateAsync(sessionId);
 * ```
 */
export function useRevokeMySession(): UseMutationResult<void, Error, UserSessionId> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.sessionsBasePath;

  return useMutation({
    mutationFn: (sessionId: UserSessionId) => revokeMySession(config.client, basePath, sessionId),
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
 * const revokeOthers = useRevokeMyOtherSessions();
 * const { revokedCount } = await revokeOthers.mutateAsync();
 * ```
 */
export function useRevokeMyOtherSessions(): UseMutationResult<
  UserSessionsRevokedResponse,
  Error,
  void
> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.sessionsBasePath;

  return useMutation({
    mutationFn: () => revokeMyOtherSessions(config.client, basePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildIdentityQueryKey(config, 'me') });
    },
  });
}
