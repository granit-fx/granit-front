import { setOnUnauthorized } from '@granit/api-client';
import { BffProvider, useBffConfig } from '@granit/react-bff';
import { useTranslation } from '@granit/react-localization';
import { Button, Spinner } from '@granit/react-ui';
import { AlertTriangle } from 'lucide-react';
import * as React from 'react';

import { logger } from './logger';

import type { KeycloakAuthContextType, KeycloakUserInfo } from '@granit/authentication-keycloak';
import type { BffConfig, BffUser, CsrfManager } from '@granit/bff';
import type { Context, ReactNode } from 'react';

// Module-level guard: `setOnUnauthorized` warns on re-registration. Under React
// StrictMode (dev) the bridge mounts → unmounts → remounts, which would trip the
// warning. The latest `login` callback lives on `bffLatestLogin` so the one-shot
// handler always invokes the current value; `bffIsAuthenticated` mirrors the auth
// state so the handler skips redirects when the user is not authenticated yet
// (e.g. on /login), which would otherwise loop on 401s.
let bffOnUnauthorizedWired = false;
let bffLatestLogin: (() => void) | null = null;
let bffIsAuthenticated = false;
let bffCsrfManagerWired = false;

/** Pre-flight: verify the BFF endpoint is reachable before redirecting. */
async function isBffReachable(pathPrefix: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    // Intentional native fetch: an interceptor-free liveness probe. Routing this
    // through the Axios client would trip the 401→login redirect handler and loop.
    // eslint-disable-next-line no-restricted-globals
    const response = await fetch(`${pathPrefix}/bff/user`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response.status !== 502 && response.status !== 503;
  } catch {
    return false;
  }
}

/** Map BFF user claims to the auth context's user shape. */
function toBffUserInfo(user: BffUser): KeycloakUserInfo {
  const parts = user.name.split(' ');
  return {
    sub: user.sub,
    email: user.email,
    name: user.name,
    preferred_username: user.email,
    given_name: parts[0],
    family_name: parts.slice(1).join(' '),
  };
}

interface BffAuthBridgeProps {
  readonly context: Context<KeycloakAuthContextType | undefined>;
  readonly pathPrefix: string;
  readonly layout: React.ComponentType<{ readonly children: ReactNode }>;
  readonly onCsrfManager?: (manager: CsrfManager) => void;
  readonly children: ReactNode;
}

/** Inner bridge: reads BFF context and provides the app-level auth context. */
function BffAuthBridge({
  context: AuthContext,
  pathPrefix,
  layout: Layout,
  onCsrfManager,
  children,
}: BffAuthBridgeProps) {
  const { user, isAuthenticated, isLoading, login, logout, csrfManager } = useBffConfig();
  const { t } = useTranslation();
  const [backendDown, setBackendDown] = React.useState(false);

  // Wire the CsrfManager into the host's API client (host-provided setter).
  React.useEffect(() => {
    onCsrfManager?.(csrfManager);
    if (!bffCsrfManagerWired) {
      bffCsrfManagerWired = true;
      logger.debug('[BffAuth] CsrfManager wired to API client');
    }
  }, [csrfManager, onCsrfManager]);

  React.useEffect(() => {
    bffLatestLogin = login;
  }, [login]);
  React.useEffect(() => {
    bffIsAuthenticated = isAuthenticated;
  }, [isAuthenticated]);
  React.useEffect(() => {
    if (bffOnUnauthorizedWired) return;
    bffOnUnauthorizedWired = true;
    setOnUnauthorized(() => {
      // Skip redirect when not authenticated: the user is already on an auth page
      // (e.g. /login) and 401s there are expected; redirecting would loop.
      if (!bffIsAuthenticated) {
        logger.warn('[BffAuth] Unauthorized while not authenticated — skipping BFF redirect');
        return;
      }
      logger.warn('[BffAuth] Unauthorized — redirecting to BFF login');
      bffLatestLogin?.();
    });
  }, []);

  const mappedUser = React.useMemo(() => (user ? toBffUserInfo(user) : null), [user]);

  // Safe login: check backend reachability before redirecting.
  const safeLogin = React.useCallback(async () => {
    const reachable = await isBffReachable(pathPrefix);
    if (reachable) {
      login();
    } else {
      logger.error('[BffAuth] Backend unreachable — cannot redirect to login');
      setBackendDown(true);
    }
  }, [login, pathPrefix]);

  const value = React.useMemo<KeycloakAuthContextType>(
    () => ({
      keycloak: null,
      authenticated: isAuthenticated,
      loading: isLoading,
      user: mappedUser,
      login: safeLogin,
      logout,
    }),
    [isAuthenticated, isLoading, mappedUser, safeLogin, logout]
  );

  if (isLoading) {
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

  if (backendDown) {
    return (
      <Layout>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {t('Auth.BackendUnavailable.Title', 'Service unavailable')}
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {t(
              'Auth.BackendUnavailable.Message',
              'The authentication server is not responding. Please try again later or contact your administrator.'
            )}
          </p>
          <Button
            onClick={() => {
              setBackendDown(false);
              safeLogin().catch(() => undefined);
            }}
          >
            {t('Auth.BackendUnavailable.Retry', 'Retry')}
          </Button>
        </div>
      </Layout>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const Passthrough = ({ children }: { readonly children: ReactNode }) => <>{children}</>;

export interface BffAuthProviderProps {
  /** The app's auth context (from `createAuthContext`). */
  readonly context: Context<KeycloakAuthContextType | undefined>;
  /** BFF config (`pathPrefix` + optional logger). */
  readonly config: BffConfig;
  /** Host layout wrapper for the backend-unavailable screen. Defaults to a passthrough. */
  readonly layout?: React.ComponentType<{ readonly children: ReactNode }>;
  /** Wire the BFF `CsrfManager` into the host's API client (CSRF interceptor). */
  readonly onCsrfManager?: (manager: CsrfManager) => void;
  readonly children: ReactNode;
}

/**
 * BFF auth provider — wraps `@granit/react-bff`'s `BffProvider` and adapts its
 * session to the app's auth context, wiring the 401→login bridge and the CSRF
 * manager, and rendering init / backend-unavailable states. The host owns its
 * context instance, BFF config, layout and API-client CSRF wiring.
 */
export function BffAuthProvider({
  context,
  config,
  layout = Passthrough,
  onCsrfManager,
  children,
}: BffAuthProviderProps) {
  return (
    <BffProvider config={config}>
      <BffAuthBridge
        context={context}
        pathPrefix={config.pathPrefix}
        layout={layout}
        onCsrfManager={onCsrfManager}
      >
        {children}
      </BffAuthBridge>
    </BffProvider>
  );
}
