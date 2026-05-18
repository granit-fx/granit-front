import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

/**
 * Clears the React Query cache whenever the authenticated user id changes.
 *
 * Complements {@link useClearQueriesOnTenantChange}: tenant-scoped cache
 * clearing handles tenant switches, but **not** user switches inside the
 * same tenant. A logout from user A followed by a login from user B
 * (same tenant) would otherwise leave user A's responses cached and
 * available to user B until they go stale — a confidentiality issue,
 * especially when query keys do not include the user id explicitly.
 *
 * Pass the current user's stable identifier (typically `user.sub` from
 * `useBffAuth()` or the Keycloak `tokenParsed.sub`). The hook clears the
 * cache on every transition, including login (`undefined → sub`) and
 * logout (`sub → undefined`).
 *
 * @example
 * ```tsx
 * function App() {
 *   const { user } = useBffAuth();
 *   useClearQueriesOnUserChange(user?.sub);
 *   return <Routes />;
 * }
 * ```
 */
export function useClearQueriesOnUserChange(userId: string | undefined): void {
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | undefined>(userId);

  useEffect(() => {
    const previous = previousUserIdRef.current;
    if (previous !== userId) {
      queryClient.clear();
      previousUserIdRef.current = userId;
    }
  }, [userId, queryClient]);
}
