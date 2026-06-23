import { CsrfManager, parseBffSessionResponse } from '@granit/bff';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { logger as fallbackLogger } from '../logger';

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

// Marks that a login redirect is in flight. Survives the full-page navigation
// to the BFF/IdP and back (same-origin sessionStorage), so the first session
// check after the callback knows to tolerate a transient `authenticated:false`.
const LOGIN_PENDING_KEY = 'granit.bff.login-pending';

// Backoff schedule (ms) for re-checking `/bff/user` when it reports
// `authenticated:false` while a login is pending — the session cookie can lag
// the callback redirect by a few ms. One entry per retry; an empty/exhausted
// schedule falls through to the unauthenticated path.
const LOGIN_RECHECK_BACKOFF_MS = [200, 500] as const;

function readLoginPending(): boolean {
  try {
    return globalThis.sessionStorage?.getItem(LOGIN_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

function setLoginPending(pending: boolean): void {
  try {
    if (pending) {
      globalThis.sessionStorage?.setItem(LOGIN_PENDING_KEY, '1');
    } else {
      globalThis.sessionStorage?.removeItem(LOGIN_PENDING_KEY);
    }
  } catch (error) {
    // sessionStorage unavailable (SSR / privacy mode) — the backoff simply
    // never engages, which degrades gracefully to the previous behaviour.
    fallbackLogger.debug('login-pending flag not persisted (sessionStorage unavailable)', {
      error: String(error),
    });
  }
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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

    const markUnauthenticated = () => {
      setLoginPending(false);
      setUser(null);
      configRef.current.onUnauthenticated?.();
    };

    // The CSRF token is required for mutations, NOT for the authenticated state.
    // Fetch it best-effort: a transient CSRF failure must not bounce a genuinely
    // authenticated user back into a login loop. The CsrfManager / api-client
    // interceptor refreshes on demand later.
    const prefetchCsrf = () => {
      // Fire-and-forget: the `.catch` below fully settles the promise, so it is
      // never floating — no `void` operator needed.
      csrfManager.fetchToken().catch((error: unknown) => {
        (configRef.current.logger ?? fallbackLogger).warn(
          '[@granit/react-bff] CSRF token prefetch failed; will refresh on demand',
          { error: String(error) }
        );
      });
    };

    // One round-trip to `/bff/user`. Returns 'retry' to attempt again after a
    // backoff, or 'stop' once the auth state for this turn is settled.
    const runSessionAttempt = async (attempt: number): Promise<'retry' | 'stop'> => {
      const response = await fetch(`${configRef.current.pathPrefix}/bff/user`, {
        credentials: 'include',
      });
      if (cancelled) return 'stop';

      // Validate transport-level success and content-type before parsing —
      // captive portals, proxy error pages and HTML redirects can otherwise
      // flow attacker-influenced fields into the auth context.
      if (!response.ok) {
        markUnauthenticated();
        return 'stop';
      }
      // JSON.parse will throw on HTML captive-portal responses; the
      // discriminated-union parser below enforces the granit-dotnet contract
      // (IsHost ⇔ tenantId absent), so attacker-influenced or malformed
      // payloads cannot flow into the auth context — see VULN-205.
      const raw = (await response.json()) as unknown;
      if (cancelled) return 'stop';

      const parsed = parseBffSessionResponse(raw);
      if (!parsed.success) {
        (configRef.current.logger ?? fallbackLogger).warn(
          '[@granit/react-bff] Malformed /bff/user response — treating as unauthenticated',
          { issues: parsed.issues }
        );
        markUnauthenticated();
        return 'stop';
      }

      if (parsed.data.authenticated) {
        setLoginPending(false);
        setUser(parsed.data);
        prefetchCsrf();
        return 'stop';
      }

      // authenticated:false. Right after a login/callback round-trip the
      // session cookie can momentarily lag — re-check with a short backoff
      // before forcing another login flow, but only while a login is
      // pending (a cold anonymous load must redirect immediately, no delay).
      if (readLoginPending() && attempt < LOGIN_RECHECK_BACKOFF_MS.length) {
        await delay(LOGIN_RECHECK_BACKOFF_MS[attempt]!);
        return cancelled ? 'stop' : 'retry';
      }

      markUnauthenticated();
      return 'stop';
    };

    const checkSession = async () => {
      try {
        // Single try/finally around the whole retry loop so `isLoading` flips
        // to false exactly once, at the end — not between backoff attempts.
        for (let attempt = 0; ; attempt++) {
          if ((await runSessionAttempt(attempt)) === 'stop') return;
        }
      } catch (error) {
        if (cancelled) return;
        const message = '[@granit/react-bff] BFF session check failed';
        (configRef.current.logger ?? fallbackLogger).warn(message, { error: String(error) });
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void checkSession();

    const interval = configRef.current.sessionCheckInterval ?? 60_000;
    if (interval > 0) {
      // ±10% jitter prevents a synchronised request herd across tabs/users,
      // and visibilitychange gating avoids polling background tabs. Uses
      // crypto.getRandomValues() rather than Math.random() — not for
      // security but to keep Sonar's S2245 rule clean across the codebase.
      const jitter = () => {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        const r = buf[0]! / 2 ** 32;
        return interval * (0.9 + r * 0.2);
      };
      let timer: ReturnType<typeof setTimeout> | undefined;

      const schedule = () => {
        timer = setTimeout(() => {
          if (cancelled) return;
          if (typeof document === 'undefined' || !document.hidden) {
            void checkSession();
          }
          schedule();
        }, jitter());
      };
      schedule();

      const onVisibility = () => {
        if (typeof document !== 'undefined' && !document.hidden && !cancelled) {
          void checkSession();
        }
      };
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', onVisibility);
      }

      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
        if (typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', onVisibility);
        }
      };
    }

    return () => {
      cancelled = true;
    };
  }, [csrfManager]);

  const login = useCallback(() => {
    // Flag the in-flight login so the first session check after the callback
    // tolerates a transient unauthenticated response (see checkSession backoff).
    setLoginPending(true);
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
