import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { setTokenGetter, setOnUnauthorized } from '@granit/api-client';
import * as React from 'react';

import type { LoginOptions, LogoutOptions, OidcUserInfo } from '@granit/authentication';
import type { EntraIdAuthContextType, EntraIdCoreConfig } from '@granit/authentication-entraid';

export interface EntraIdCoreResult extends EntraIdAuthContextType {
  /** Direct ref to the MSAL PublicClientApplication instance. */
  msalRef: React.RefObject<PublicClientApplication | null>;

  /** Redirect to the Entra ID login page with optional overrides. */
  login: (options?: LoginOptions) => void;
  /** Redirect to the Entra ID logout page with optional overrides. */
  logout: (options?: LogoutOptions) => void;
}

const DEFAULT_SCOPES = ['openid', 'profile', 'email'] as const;

/** Extract standard OIDC claims from MSAL account info. */
function extractUser(account: {
  username?: string;
  name?: string;
  idTokenClaims?: Record<string, unknown>;
}): OidcUserInfo {
  const claims = account.idTokenClaims ?? {};
  return {
    sub: (claims.sub ?? claims.oid ?? '') as string,
    email: (claims.email ?? account.username) as string | undefined,
    name: (claims.name ?? account.name) as string | undefined,
    preferred_username: account.username,
    given_name: claims.given_name as string | undefined,
    family_name: claims.family_name as string | undefined,
  };
}

/**
 * Microsoft Entra ID initialization hook.
 *
 * Handles: MSAL instantiation, silent SSO check, token acquisition,
 * user info extraction from ID token claims, and wiring the Bearer
 * token to `@granit/api-client`.
 */
export function useEntraIdInit(config: EntraIdCoreConfig): EntraIdCoreResult {
  const [authenticated, setAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<OidcUserInfo | null>(null);

  const msalRef = React.useRef<PublicClientApplication | null>(null);
  const initStartedRef = React.useRef(false);

  const scopes = React.useMemo(() => [...(config.scopes ?? DEFAULT_SCOPES)], [config.scopes]);

  React.useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const initMsal = async () => {
      try {
        const msalInstance = new PublicClientApplication({
          auth: {
            clientId: config.clientId,
            authority: config.authority,
            redirectUri: config.redirectUri,
          },
          // Default to in-memory cache — OIDC tokens stored in
          // localStorage/sessionStorage are readable by any same-origin script
          // (XSS, malicious extensions). See EntraIdCoreConfig.cacheLocation.
          cache: { cacheLocation: config.cacheLocation ?? 'memory' },
        });

        await msalInstance.initialize();
        msalRef.current = msalInstance;

        // Handle redirect response (after login redirect)
        const response = await msalInstance.handleRedirectPromise();
        if (response?.account) {
          msalInstance.setActiveAccount(response.account);
        }

        const activeAccount = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];

        if (activeAccount) {
          msalInstance.setActiveAccount(activeAccount);
          setUser(extractUser(activeAccount));
          setAuthenticated(true);

          setTokenGetter(async (): Promise<string | undefined> => {
            try {
              const result = await msalInstance.acquireTokenSilent({ scopes });
              return result.accessToken;
            } catch (err) {
              if (err instanceof InteractionRequiredAuthError) {
                config.onAcquireTokenFailure?.();
              }
              return undefined;
            }
          });

          setOnUnauthorized(() => {
            msalInstance.logoutRedirect();
          });
        }
      } catch (error) {
        globalThis.console.warn(
          '[@granit/react-authentication-entraid] MSAL initialization failed',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    void initMsal();
  }, [config.clientId, config.authority, config.redirectUri, scopes, config.onAcquireTokenFailure]);

  const login = React.useCallback(
    async (options?: LoginOptions) => {
      await msalRef.current?.loginRedirect({
        scopes,
        redirectUri: options?.redirectUri,
        loginHint: options?.loginHint,
        prompt: options?.prompt,
      });
    },
    [scopes]
  );

  const logout = React.useCallback(async (options?: LogoutOptions) => {
    await msalRef.current?.logoutRedirect({
      postLogoutRedirectUri: options?.redirectUri,
    });
  }, []);

  return {
    msalRef,
    msalInstance: msalRef.current,
    authenticated,
    loading,
    user,
    login,
    logout,
  };
}
