import { CsrfManager } from '@granit/bff';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

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

  const login = () => {
    window.location.href = `${configRef.current.pathPrefix}/bff/login`;
  };

  const logout = () => {
    window.location.href = `${configRef.current.pathPrefix}/bff/logout`;
  };

  return (
    <BffContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        csrfManager,
        pathPrefix: config.pathPrefix,
      }}
    >
      {children}
    </BffContext.Provider>
  );
}

/**
 * Access the BFF authentication context.
 *
 * @throws Error if used outside of a `<BffProvider>`.
 */
export function useBffContext(): BffContextType {
  const context = useContext(BffContext);
  if (!context) {
    throw new Error('useBffContext must be used within a <BffProvider>');
  }
  return context;
}
