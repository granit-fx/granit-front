import { setTokenGetter, setOnUnauthorized } from '@granit/api-client';
import Keycloak from 'keycloak-js';
import * as React from 'react';

import { logger } from '../logger';

import type { LoginOptions, LogoutOptions } from '@granit/authentication';
import type {
  KeycloakAuthContextType,
  KeycloakCoreConfig,
  KeycloakUserInfo,
} from '@granit/authentication-keycloak';

export interface KeycloakCoreResult extends KeycloakAuthContextType {
  /**
   * Direct ref to the Keycloak instance.
   * Expose to consuming apps that need to build custom login/logout URLs (e.g. Capacitor).
   */
  keycloakRef: React.RefObject<Keycloak | null>;

  /** Redirect to the Keycloak login page with optional overrides. */
  login: (options?: LoginOptions) => void;
  /** Redirect to the Keycloak logout page with optional overrides. */
  logout: (options?: LogoutOptions) => void;
  /** Shortcut for `login({ action: 'register' })`. */
  register: (options?: Omit<LoginOptions, 'action'>) => void;

  /** Check whether the user has a realm-level role. Returns false when unauthenticated. */
  hasRealmRole: (role: string) => boolean;
  /** Check whether the user has a resource-level role. Returns false when unauthenticated. */
  hasResourceRole: (role: string, resource?: string) => boolean;

  /** Returns true when the access token expires within `minValidity` seconds (default 0). */
  isTokenExpired: (minValidity?: number) => boolean;
  /** Decoded JWT payload — undefined before authentication. */
  tokenParsed: Record<string, unknown> | undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Starts a 60 s interval that proactively keeps the Keycloak token alive. */
function startTokenRefresh(keycloak: Keycloak): ReturnType<typeof setInterval> {
  return setInterval(() => {
    keycloak.updateToken(70).catch(() => {
      // Token refresh failed — app will handle re-login via onAuthRefreshError
      logger.warn('Proactive token refresh failed; re-login handled via onAuthRefreshError');
    });
  }, 60_000);
}

/** Extract standard OIDC claims from a decoded JWT. */
function extractUserFromToken(parsed: Record<string, unknown>): KeycloakUserInfo {
  return {
    sub: parsed.sub as string,
    email: parsed.email as string | undefined,
    name: parsed.name as string | undefined,
    preferred_username: parsed.preferred_username as string | undefined,
    given_name: parsed.given_name as string | undefined,
    family_name: parsed.family_name as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Shared Keycloak initialization hook (web-only, no Capacitor logic).
 *
 * Handles: instantiation, check-sso init, PKCE S256, token refresh every 60s,
 * user info loading (via `/userinfo` or `tokenParsed`), lifecycle events, role
 * checking, and wiring the Bearer token to `@granit/api-client`.
 *
 * Consuming apps that need native/Capacitor support should:
 * 1. Use `keycloakRef` to build platform-specific login/logout URLs
 * 2. Provide their own `login`/`logout`/`register` overrides
 * 3. Add the Capacitor `appUrlOpen` listener themselves
 */
export function useKeycloakInit(config: KeycloakCoreConfig): KeycloakCoreResult {
  const [authenticated, setAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<KeycloakUserInfo | null>(null);

  const keycloakRef = React.useRef<Keycloak | null>(null);
  const initStartedRef = React.useRef(false);

  React.useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    let refreshInterval: ReturnType<typeof setInterval>;

    const initKeycloak = async () => {
      try {
        const keycloak = new Keycloak({
          url: config.url,
          realm: config.realm,
          clientId: config.clientId,
        });

        keycloakRef.current = keycloak;

        // ----- Lifecycle event wiring -------------------------
        keycloak.onTokenExpired = () => {
          config.onTokenExpired?.();
          config.onEvent?.('onTokenExpired');
        };

        keycloak.onAuthRefreshError = () => {
          setAuthenticated(false);
          config.onAuthRefreshError?.();
          config.onEvent?.('onAuthRefreshError');
          // Session revoked via back-channel logout → refresh fails → force logout
          keycloak.logout();
        };

        keycloak.onAuthLogout = () => {
          setAuthenticated(false);
          setUser(null);
          logger.info('Keycloak session logged out');
          config.onAuthLogout?.();
          config.onEvent?.('onAuthLogout');
        };

        keycloak.onAuthRefreshSuccess = () => {
          config.onEvent?.('onAuthRefreshSuccess');
          if (config.useTokenClaims && keycloak.tokenParsed) {
            setUser(extractUserFromToken(keycloak.tokenParsed as Record<string, unknown>));
          }
        };

        keycloak.onAuthSuccess = () => {
          logger.info('Keycloak authentication succeeded');
          config.onEvent?.('onAuthSuccess');
        };
        keycloak.onAuthError = (err) => config.onEvent?.('onAuthError', err);
        keycloak.onReady = () => config.onEvent?.('onReady');

        // ----- Initialization --------------------------------------------
        const silentCheckSso = config.silentCheckSso !== false;
        const auth = await keycloak.init({
          onLoad: 'check-sso',
          pkceMethod: 'S256',
          checkLoginIframe: false,
          silentCheckSsoFallback: config.silentCheckSsoFallback ?? true,
          ...(silentCheckSso
            ? { silentCheckSsoRedirectUri: `${globalThis.location.origin}/silent-check-sso.html` }
            : {}),
        });

        setAuthenticated(auth);

        if (auth) {
          refreshInterval = startTokenRefresh(keycloak);

          // ----- User info loading ----------------------------
          if (config.useTokenClaims) {
            if (keycloak.tokenParsed) {
              setUser(extractUserFromToken(keycloak.tokenParsed as Record<string, unknown>));
            }
          } else {
            try {
              const userInfo = await keycloak.loadUserInfo();
              setUser(userInfo as KeycloakUserInfo);
            } catch {
              // User info load failed — non-fatal
              logger.warn('Failed to load Keycloak user info; continuing without profile claims');
            }
          }

          setTokenGetter(async (): Promise<string | undefined> => {
            if (keycloakRef.current) {
              try {
                await keycloakRef.current.updateToken(5);
                return keycloakRef.current.token;
              } catch {
                logger.warn('Token refresh on demand failed; request will proceed unauthenticated');
                return undefined;
              }
            }
            return undefined;
          });

          setOnUnauthorized(() => {
            keycloakRef.current?.logout();
          });
        }
      } catch (err) {
        // Keycloak init failed — stay unauthenticated
        logger.error('Keycloak initialization failed; staying unauthenticated', err);
      } finally {
        setLoading(false);
      }
    };

    void initKeycloak();

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [
    config.url,
    config.realm,
    config.clientId,
    config.silentCheckSso,
    config.silentCheckSsoFallback,
    config.useTokenClaims,
    config.onTokenExpired,
    config.onAuthRefreshError,
    config.onAuthLogout,
    config.onEvent,
  ]);

  // ----- Actions ------------------------------------------------
  const login = React.useCallback(async (options?: LoginOptions) => {
    await keycloakRef.current?.login(options);
  }, []);

  const logout = React.useCallback(async (options?: LogoutOptions) => {
    await keycloakRef.current?.logout(options);
  }, []);

  const register = React.useCallback(async (options?: Omit<LoginOptions, 'action'>) => {
    await keycloakRef.current?.register(options);
  }, []);

  // ----- Role checking ------------------------------------------
  const hasRealmRole = React.useCallback((role: string): boolean => {
    return keycloakRef.current?.hasRealmRole(role) ?? false;
  }, []);

  const hasResourceRole = React.useCallback((role: string, resource?: string): boolean => {
    return keycloakRef.current?.hasResourceRole(role, resource) ?? false;
  }, []);

  // ----- Token state --------------------------------------------
  const isTokenExpired = React.useCallback((minValidity?: number): boolean => {
    return keycloakRef.current?.isTokenExpired(minValidity ?? 0) ?? true;
  }, []);

  return {
    keycloakRef,
    keycloak: keycloakRef.current,
    authenticated,
    loading,
    user,
    login,
    logout,
    register,
    hasRealmRole,
    hasResourceRole,
    isTokenExpired,
    tokenParsed: keycloakRef.current?.tokenParsed as Record<string, unknown> | undefined,
  };
}
