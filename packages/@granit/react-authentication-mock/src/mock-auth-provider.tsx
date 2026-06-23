import { BffProvider } from '@granit/react-bff';
import { useEffect, useMemo, useState } from 'react';

import type { KeycloakAuthContextType, KeycloakUserInfo } from '@granit/authentication-keycloak';
import type { BffConfig } from '@granit/bff';
import type { Context, ReactNode } from 'react';

const noop = () => {};

export interface MockAuthProviderProps {
  /**
   * The app's auth context (from `createAuthContext`). The provider fills it with
   * a fake authenticated value so `useAuth()` resolves without a real IdP.
   */
  readonly context: Context<KeycloakAuthContextType | undefined>;
  /** The fake signed-in user. */
  readonly user: KeycloakUserInfo;
  /**
   * When set, the tree is wrapped in a `BffProvider` so `useBffConfig` consumers
   * (e.g. session cards) work against MSW-backed BFF endpoints in mock mode.
   */
  readonly bffConfig?: BffConfig;
  /** Artificial init delay (ms) before children render. Default 0 (immediate). */
  readonly loadingMs?: number;
  /** Rendered while the artificial delay elapses. Default `null`. */
  readonly loadingFallback?: ReactNode;
  readonly children: ReactNode;
}

/**
 * Development / test auth provider. Pattern-agnostic and IdP-free: it satisfies
 * the app's auth context with a configurable fake user and no-op login/logout.
 * The app keeps owning its context instance and demo user; this package owns the
 * reusable mechanism.
 */
export function MockAuthProvider({
  context: AuthContext,
  user,
  bffConfig,
  loadingMs = 0,
  loadingFallback = null,
  children,
}: MockAuthProviderProps) {
  const [loading, setLoading] = useState(loadingMs > 0);

  useEffect(() => {
    if (loadingMs <= 0) return undefined;
    const timer = setTimeout(() => setLoading(false), loadingMs);
    return () => clearTimeout(timer);
  }, [loadingMs]);

  const value = useMemo<KeycloakAuthContextType>(
    () => ({ keycloak: null, authenticated: true, loading, user, login: noop, logout: noop }),
    [loading, user]
  );

  if (loading) return <>{loadingFallback}</>;

  const tree = <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  return bffConfig ? <BffProvider config={bffConfig}>{tree}</BffProvider> : tree;
}
