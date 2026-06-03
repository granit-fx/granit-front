import { setTokenGetter, setOnUnauthorized } from '@granit/api-client';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import * as React from 'react';

import type { LoginOptions, LogoutOptions, OidcUserInfo } from '@granit/authentication';
import type { CognitoAuthContextType, CognitoCoreConfig } from '@granit/authentication-cognito';
import type { ICognitoStorage } from 'amazon-cognito-identity-js';

/**
 * In-memory implementation of the Cognito SDK storage contract. Tokens live
 * only for the lifetime of the tab and are never readable by other same-origin
 * scripts via `localStorage`/`sessionStorage`. This is the default so a
 * compromised script (XSS, extension) cannot lift the refresh token. See
 * security audit VULN-102.
 */
class InMemoryCognitoStorage implements ICognitoStorage {
  private readonly store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

/** Resolve the Cognito token store from the configured posture (default: memory). */
function resolveCognitoStorage(tokenStorage: CognitoCoreConfig['tokenStorage']): ICognitoStorage {
  if (tokenStorage === 'localStorage') return globalThis.localStorage;
  if (tokenStorage === 'sessionStorage') return globalThis.sessionStorage;
  return new InMemoryCognitoStorage();
}

export interface CognitoCoreResult extends CognitoAuthContextType {
  /** Direct ref to the Cognito UserPool instance. */
  userPoolRef: React.RefObject<CognitoUserPool | null>;

  /** Redirect to the Cognito Hosted UI for login. */
  login: (options?: LoginOptions) => void;
  /** Sign out from Cognito (local + optionally global). */
  logout: (options?: LogoutOptions) => void;
}

interface CognitoSessionLike {
  isValid: () => boolean;
  getIdToken: () => { getJwtToken: () => string };
  getAccessToken: () => { getJwtToken: () => string };
}

/** Extract standard OIDC claims from Cognito user attributes. */
function extractUser(attributes: Record<string, string>): OidcUserInfo {
  return {
    sub: attributes.sub ?? '',
    email: attributes.email,
    name: attributes.name,
    preferred_username: attributes.preferred_username,
    given_name: attributes.given_name,
    family_name: attributes.family_name,
    picture: attributes.picture,
  };
}

/** Create a token-refresh function that resolves the current access token. */
function createTokenRefresher(
  cognitoUser: {
    getSession: (cb: (err: Error | null, session: CognitoSessionLike | null) => void) => void;
  },
  onTokenRefreshError?: () => void
): () => Promise<string | undefined> {
  return () =>
    new Promise((resolve) => {
      cognitoUser.getSession((err, session) => {
        if (err || !session?.isValid()) {
          onTokenRefreshError?.();
          resolve(undefined);
          return;
        }
        resolve(session.getAccessToken().getJwtToken());
      });
    });
}

/**
 * AWS Cognito initialization hook.
 *
 * Handles: UserPool instantiation, current session check, token refresh,
 * user attribute extraction, and wiring the Bearer token to `@granit/api-client`.
 */
export function useCognitoInit(config: CognitoCoreConfig): CognitoCoreResult {
  const [authenticated, setAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<OidcUserInfo | null>(null);

  const userPoolRef = React.useRef<CognitoUserPool | null>(null);
  const initStartedRef = React.useRef(false);

  React.useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const pool = new CognitoUserPool({
      UserPoolId: config.userPoolId,
      ClientId: config.clientId,
      Storage: resolveCognitoStorage(config.tokenStorage),
    });
    userPoolRef.current = pool;

    const cognitoUser = pool.getCurrentUser();
    if (!cognitoUser) {
      setLoading(false);
      return;
    }

    const refreshToken = createTokenRefresher(cognitoUser, config.onTokenRefreshError);

    cognitoUser.getSession((err: Error | null, session: CognitoSessionLike | null) => {
      if (err || !session?.isValid()) {
        setLoading(false);
        config.onSessionExpired?.();
        return;
      }

      setAuthenticated(true);

      cognitoUser.getUserAttributes((attrErr, attributes) => {
        if (!attrErr && attributes) {
          const attrMap: Record<string, string> = {};
          for (const attr of attributes) {
            attrMap[attr.Name] = attr.Value;
          }
          setUser(extractUser(attrMap));
        }
        setLoading(false);
      });

      setTokenGetter(refreshToken);

      setOnUnauthorized(() => {
        cognitoUser.signOut();
        setAuthenticated(false);
        setUser(null);
      });
    });
  }, [
    config.userPoolId,
    config.clientId,
    config.tokenStorage,
    config.onSessionExpired,
    config.onTokenRefreshError,
  ]);

  const login = React.useCallback(
    (options?: LoginOptions) => {
      if (!config.domain) return;
      const scopes = config.scopes?.join('+') ?? 'openid+profile+email';
      const redirectUri = options?.redirectUri ?? globalThis.location.origin;
      globalThis.location.href = `https://${config.domain}/login?client_id=${config.clientId}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    },
    [config.domain, config.clientId, config.scopes]
  );

  const logout = React.useCallback((options?: LogoutOptions) => {
    const cognitoUser = userPoolRef.current?.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    setAuthenticated(false);
    setUser(null);
    if (options?.redirectUri) {
      globalThis.location.href = options.redirectUri;
    }
  }, []);

  return {
    userPoolRef,
    userPool: userPoolRef.current,
    authenticated,
    loading,
    user,
    login,
    logout,
  };
}
