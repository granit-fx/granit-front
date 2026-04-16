import { listBffSessions, revokeAllOtherBffSessions, revokeBffSession } from '@granit/bff';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useBffConfig } from '../providers/bff-provider.js';

import type { BffSessionInfo } from '@granit/bff';

interface UseBffSessionsResult {
  /** Active sessions for the current user. Empty array while loading. */
  readonly sessions: readonly BffSessionInfo[];
  /** Whether the initial fetch is in progress. */
  readonly isLoading: boolean;
  /** Error from the last fetch attempt, or null. */
  readonly error: Error | null;
  /** Re-fetch the session list. */
  readonly refetch: () => Promise<void>;
}

/**
 * Hook to list the current user's active BFF sessions.
 *
 * Only fetches when the user is authenticated.
 */
export function useBffSessions(): UseBffSessionsResult {
  const { isAuthenticated, isLoading: authLoading, pathPrefix } = useBffConfig();

  const [sessions, setSessions] = useState<readonly BffSessionInfo[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      setFetchLoading(true);
      setError(null);
      const result = await listBffSessions(pathPrefix);
      if (mountedRef.current) {
        setSessions(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setFetchLoading(false);
      }
    }
  }, [pathPrefix]);

  useEffect(() => {
    mountedRef.current = true;
    if (isAuthenticated) {
      refetch().catch(() => undefined);
    } else if (!authLoading) {
      setSessions([]);
    }
    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated, authLoading, refetch]);

  const isLoading = authLoading || fetchLoading;

  return { sessions, isLoading, error, refetch } as const;
}

interface UseRevokeBffSessionResult {
  /** Revoke a specific session by its masked ID. Returns a promise that resolves on success. */
  readonly revoke: (sessionId: string) => Promise<void>;
  /** Whether a revocation is in progress. */
  readonly isRevoking: boolean;
}

/**
 * Hook to revoke a specific BFF session.
 *
 * Cannot revoke the current session — use logout instead.
 */
export function useRevokeBffSession(): UseRevokeBffSessionResult {
  const { pathPrefix, csrfManager } = useBffConfig();
  const [isRevoking, setIsRevoking] = useState(false);

  const revoke = useCallback(
    async (sessionId: string) => {
      setIsRevoking(true);
      try {
        await revokeBffSession(pathPrefix, sessionId, csrfManager);
      } finally {
        setIsRevoking(false);
      }
    },
    [pathPrefix, csrfManager]
  );

  return { revoke, isRevoking } as const;
}

interface UseRevokeAllOtherBffSessionsResult {
  /** Revoke all sessions except the current one ("log out everywhere else"). */
  readonly revokeAll: () => Promise<void>;
  /** Whether a revocation is in progress. */
  readonly isRevoking: boolean;
}

/**
 * Hook to revoke all other BFF sessions except the current one.
 *
 * Use case: "Log out everywhere else".
 */
export function useRevokeAllOtherBffSessions(): UseRevokeAllOtherBffSessionsResult {
  const { pathPrefix, csrfManager } = useBffConfig();
  const [isRevoking, setIsRevoking] = useState(false);

  const revokeAll = useCallback(async () => {
    setIsRevoking(true);
    try {
      await revokeAllOtherBffSessions(pathPrefix, csrfManager);
    } finally {
      setIsRevoking(false);
    }
  }, [pathPrefix, csrfManager]);

  return { revokeAll, isRevoking } as const;
}
