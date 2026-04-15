import { useBffConfig } from '../providers/bff-provider.js';

/**
 * Hook to access BFF authentication state and actions.
 *
 * Returns user, isAuthenticated, isLoading, login(), and logout().
 *
 * @throws Error if used outside of a `<BffProvider>`.
 */
export function useBffAuth() {
  const { user, isAuthenticated, isLoading, login, logout } = useBffConfig();
  return { user, isAuthenticated, isLoading, login, logout } as const;
}
