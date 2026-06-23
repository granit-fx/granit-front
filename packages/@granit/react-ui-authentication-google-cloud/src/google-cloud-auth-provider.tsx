import { useGoogleCloudInit } from '@granit/react-authentication-google-cloud';
import { useTranslation } from '@granit/react-localization';
import { Spinner } from '@granit/react-ui';
import { useCallback, useMemo } from 'react';

import type { GoogleCloudCoreConfig } from '@granit/authentication-google-cloud';
import type { KeycloakAuthContextType } from '@granit/authentication-keycloak';
import type { Context, ReactNode } from 'react';

export interface GoogleCloudAuthProviderProps {
  /** The app's auth context (from `createAuthContext`). */
  readonly context: Context<KeycloakAuthContextType | undefined>;
  /** GoogleCloud core config (from the host environment). */
  readonly config: GoogleCloudCoreConfig;
  readonly children: ReactNode;
}

/**
 * GoogleCloud auth provider. Wires `useGoogleCloudInit` into the app's auth context, forwards the
 * active UI locale to the IdP login, and renders an init spinner until the session
 * resolves. App-agnostic: the host owns its context instance and decides (via its
 * auth-mode) whether to mount this provider. Companion to the Keycloak provider.
 */
export function GoogleCloudAuthProvider({
  context: AuthContext,
  config,
  children,
}: GoogleCloudAuthProviderProps) {
  const { t, i18n } = useTranslation();
  const {
    authenticated,
    loading,
    user,
    login: hookLogin,
    logout: hookLogout,
  } = useGoogleCloudInit(config);

  const login = useCallback(() => hookLogin({ locale: i18n.language }), [hookLogin, i18n.language]);
  const logout = useCallback(() => hookLogout(), [hookLogout]);

  const value = useMemo<KeycloakAuthContextType>(
    () => ({ keycloak: null, authenticated, loading, user, login, logout }),
    [authenticated, loading, user, login, logout]
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
