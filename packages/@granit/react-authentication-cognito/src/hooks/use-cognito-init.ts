import { setTokenGetter, setOnUnauthorized } from '@granit/api-client';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import * as React from 'react';

import type { LoginOptions, LogoutOptions, OidcUserInfo } from '@granit/authentication';
import type { CognitoAuthContextType, CognitoCoreConfig } from '@granit/authentication-cognito';

export interface CognitoCoreResult extends CognitoAuthContextType {
  /** Direct ref to the Cognito UserPool instance. */
  userPoolRef: React.RefObject<CognitoUserPool | null>;

  /** Redirect to the Cognito Hosted UI for login. */
  login: (options?: LoginOptions) => void;
  /** Sign out from Cognito (local + optionally global). */
  logout: (options?: LogoutOptions) => void;
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
    });
    userPoolRef.current = pool;

    const cognitoUser = pool.getCurrentUser();
    if (!cognitoUser) {
      setLoading(false);
      return;
    }

    cognitoUser.getSession(
      (
        err: Error | null,
        session: {
          isValid: () => boolean;
          getIdToken: () => { getJwtToken: () => string };
          getAccessToken: () => { getJwtToken: () => string };
        } | null
      ) => {
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

        setTokenGetter(async (): Promise<string | undefined> => {
          return new Promise((resolve) => {
            cognitoUser.getSession(
              (
                refreshErr: Error | null,
                refreshSession: {
                  isValid: () => boolean;
                  getAccessToken: () => { getJwtToken: () => string };
                } | null
              ) => {
                if (refreshErr || !refreshSession?.isValid()) {
                  config.onTokenRefreshError?.();
                  resolve(undefined);
                  return;
                }
                resolve(refreshSession.getAccessToken().getJwtToken());
              }
            );
          });
        });

        setOnUnauthorized(() => {
          cognitoUser.signOut();
          setAuthenticated(false);
          setUser(null);
        });
      }
    );
  }, [config.userPoolId, config.clientId, config.onSessionExpired, config.onTokenRefreshError]);

  const login = React.useCallback(
    (options?: LoginOptions) => {
      if (!config.domain) return;
      const scopes = config.scopes?.join('+') ?? 'openid+profile+email';
      const redirectUri = options?.redirectUri ?? window.location.origin;
      window.location.href = `https://${config.domain}/login?client_id=${config.clientId}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
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
      window.location.href = options.redirectUri;
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
