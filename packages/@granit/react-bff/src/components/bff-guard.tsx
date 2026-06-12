import { useEffect, useRef } from 'react';

import { useBffAuth } from '../hooks/use-bff-auth';

import type { ReactNode } from 'react';

export interface BffGuardProps {
  readonly children: ReactNode;
  /** Shown while the session check is loading. Defaults to null. */
  readonly fallback?: ReactNode;
}

/**
 * Renders children only if the user is authenticated.
 * Redirects to the BFF login endpoint otherwise.
 *
 * The redirect is fired from an effect (never during render) and gated by a
 * one-shot ref, so a single login flow starts per mount even under React 19
 * StrictMode double-invocation or concurrent re-renders. Without the guard,
 * `login()` ran on every render while unauthenticated, kicking off overlapping
 * OIDC redirects.
 */
export function BffGuard({ children, fallback }: BffGuardProps) {
  const { isAuthenticated, isLoading, login } = useBffAuth();
  const loginStartedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      // Re-arm the guard so a later logout → unauthenticated cycle can redirect.
      loginStartedRef.current = false;
      return;
    }
    if (loginStartedRef.current) return;
    loginStartedRef.current = true;
    login();
  }, [isAuthenticated, isLoading, login]);

  if (isLoading) return <>{fallback ?? null}</>;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
