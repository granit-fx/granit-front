import { createContext, useContext, useEffect, type ReactNode } from 'react';

/**
 * The auth state every app shell needs, decoupled from how a given app resolves
 * authentication (BFF / direct / mock / Keycloak / …). The app feeds this from
 * its own auth provider via `ShellAuthProvider`.
 */
export interface ShellAuthState {
  authenticated: boolean;
  loading: boolean;
  /** Start the login flow (redirect to the identity provider, etc.). */
  login: () => void;
}

const ShellAuthContext = createContext<ShellAuthState | null>(null);

export interface ShellAuthProviderProps {
  readonly value: ShellAuthState;
  readonly children: ReactNode;
}

/** Bridge the app's auth state into the shell. Mount inside the app's auth provider. */
export function ShellAuthProvider({ value, children }: ShellAuthProviderProps) {
  return <ShellAuthContext.Provider value={value}>{children}</ShellAuthContext.Provider>;
}

export function useShellAuth(): ShellAuthState {
  const ctx = useContext(ShellAuthContext);
  if (!ctx) throw new Error('useShellAuth must be used within a <ShellAuthProvider>');
  return ctx;
}

/**
 * Gate a route subtree behind authentication: render nothing while loading or
 * unauthenticated (kicking off `login()` in the latter case), otherwise render
 * the children. Auth state comes from `ShellAuthContext`, so this is reusable
 * across every Granit React shell regardless of the auth mechanism.
 */
export function ProtectedRoute({ children }: { readonly children: ReactNode }) {
  const { authenticated, loading, login } = useShellAuth();

  useEffect(() => {
    if (!loading && !authenticated) login();
  }, [loading, authenticated, login]);

  if (loading || !authenticated) return null;

  return <>{children}</>;
}
