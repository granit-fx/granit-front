import { CsrfManager } from '@granit/bff';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { BffConfig, BffUser } from '@granit/bff';
import type { ReactNode } from 'react';

/** Shape of the BFF authentication context. */
export interface BffContextType {
  /** The authenticated user, or null if not authenticated. */
  readonly user: BffUser | null;
  /** Whether the user is authenticated. */
  readonly isAuthenticated: boolean;
  /** Whether the initial session check is in progress. */
  readonly isLoading: boolean;
  /** Redirect to the BFF login endpoint. */
  readonly login: () => void;
  /** Redirect to the BFF logout endpoint. */
  readonly logout: () => void;
  /** CSRF manager instance for advanced use cases. */
  readonly csrfManager: CsrfManager;
  /** Path prefix for this frontend (e.g., "/admin"). */
  readonly pathPrefix: string;
}

const BffContext = createContext<BffContextType | null>(null);

export interface BffProviderProps {
  readonly config: BffConfig;
  readonly children: ReactNode;
}

/** Provides BFF authentication context to the React tree. */
export function BffProvider({ config, children }: BffProviderProps) {
  const [user, setUser] = useState<BffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [csrfManager] = useState(() => new CsrfManager(config.pathPrefix));
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const response = await fetch(`${configRef.current.pathPrefix}/bff/user`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (cancelled) return;
        if (data.authenticated) {
          setUser(data as BffUser);
          await csrfManager.fetchToken();
        } else {
          setUser(null);
          configRef.current.onUnauthenticated?.();
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void checkSession();

    const interval = configRef.current.sessionCheckInterval ?? 60_000;
    if (interval > 0) {
      const timer = setInterval(() => void checkSession(), interval);
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [csrfManager]);

  const login = useCallback(() => {
    const path = globalThis.location.pathname + globalThis.location.search;
    const base = `${configRef.current.pathPrefix}/bff/login`;
    globalThis.location.href =
      path === '/' ? base : `${base}?returnUrl=${encodeURIComponent(path)}`;
  }, []);

  const logout = useCallback(() => {
    globalThis.location.href = `${configRef.current.pathPrefix}/bff/logout`;
  }, []);

  const value = useMemo<BffContextType>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      csrfManager,
      pathPrefix: config.pathPrefix,
    }),
    [user, isLoading, login, logout, csrfManager, config.pathPrefix]
  );

  return <BffContext.Provider value={value}>{children}</BffContext.Provider>;
}

/**
 * Access the BFF authentication context.
 *
 * @throws Error if used outside of a `<BffProvider>`.
 */
export function useBffConfig(): BffContextType {
  const context = useContext(BffContext);
  if (!context) {
    throw new Error('useBffConfig must be used within a <BffProvider>');
  }
  return context;
}

/** @deprecated Use useBffConfig instead */
export const useBffContext = useBffConfig;
