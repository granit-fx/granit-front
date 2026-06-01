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
 */
export function BffGuard({ children, fallback }: BffGuardProps) {
  const { isAuthenticated, isLoading, login } = useBffAuth();

  if (isLoading) return <>{fallback ?? null}</>;

  if (!isAuthenticated) {
    login();
    return null;
  }

  return <>{children}</>;
}
