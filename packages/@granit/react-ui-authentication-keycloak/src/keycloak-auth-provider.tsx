import { useKeycloakInit } from '@granit/react-authentication-keycloak';
import { useTranslation } from '@granit/react-localization';
import { Spinner } from '@granit/react-ui';
import { useCallback, useMemo } from 'react';

import type { KeycloakAuthContextType, KeycloakCoreConfig } from '@granit/authentication-keycloak';
import type { Context, ReactNode } from 'react';

export interface KeycloakAuthProviderProps {
  /**
   * The app's auth context (from `createAuthContext`). The provider fills it with
   * the live Keycloak session so `useAuth()` resolves.
   */
  readonly context: Context<KeycloakAuthContextType | undefined>;
  /**
   * Keycloak core config (`url` / `realm` / `clientId` + optional lifecycle
   * callbacks). The host supplies these from its environment.
   */
  readonly config: KeycloakCoreConfig;
  readonly children: ReactNode;
}

/**
 * Keycloak auth provider. Wires `useKeycloakInit` into the app's auth context,
 * forwards the active UI locale to the IdP login, and renders an init spinner
 * until the session resolves. App-agnostic: the host owns its context instance
 * and decides (via its auth-mode) whether to mount this provider.
 */
export function KeycloakAuthProvider({
  context: AuthContext,
  config,
  children,
}: KeycloakAuthProviderProps) {
  const { t, i18n } = useTranslation();
  const {
    keycloak,
    authenticated,
    loading,
    user,
    login: hookLogin,
    logout: hookLogout,
  } = useKeycloakInit(config);

  const login = useCallback(() => hookLogin({ locale: i18n.language }), [hookLogin, i18n.language]);
  const logout = useCallback(() => hookLogout(), [hookLogout]);

  const value = useMemo<KeycloakAuthContextType>(
    () => ({ keycloak, authenticated, loading, user, login, logout }),
    [keycloak, authenticated, loading, user, login, logout]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            {t('Auth.Initializing', 'Initializing…')}
          </p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
