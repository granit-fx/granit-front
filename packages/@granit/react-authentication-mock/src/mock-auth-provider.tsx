import { BffProvider } from '@granit/react-bff';
import { useEffect, useMemo, useState } from 'react';

import { logger } from './logger';

import type { BaseAuthContextType, OidcUserInfo } from '@granit/authentication';
import type { BffConfig } from '@granit/bff';
import type { Context, ReactNode } from 'react';

const noop = () => {};

export interface MockAuthProviderProps<T extends BaseAuthContextType> {
  /**
   * The app's auth context (from `createAuthContext`). The provider fills it with
   * a fake authenticated value so `useAuth()` resolves without a real IdP.
   */
  readonly context: Context<T | undefined>;
  /** The fake signed-in user. */
  readonly user?: OidcUserInfo;
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
export function MockAuthProvider<T extends BaseAuthContextType>({
  context: AuthContext,
  user,
  bffConfig,
  loadingMs = 0,
  loadingFallback = null,
  children,
}: MockAuthProviderProps<T>) {
  const [loading, setLoading] = useState(loadingMs > 0);

  useEffect(() => {
    if (loadingMs <= 0) return undefined;
    const timer = setTimeout(() => setLoading(false), loadingMs);
    return () => clearTimeout(timer);
  }, [loadingMs]);

  useEffect(() => {
    logger.debug('mock auth provider mounted', { authenticated: true });
  }, []);

  const value = useMemo(
    () =>
      ({
        authenticated: true,
        loading,
        user: user ?? null,
        login: noop,
        logout: noop,
      }) as T,
    [loading, user]
  );

  if (loading) return <>{loadingFallback}</>;

  const tree = <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  return bffConfig ? <BffProvider config={bffConfig}>{tree}</BffProvider> : tree;
}
