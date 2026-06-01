import { useCallback } from 'react';

import { useBffConfig } from '../providers/bff-provider';

/**
 * Hook to access the current CSRF token and refresh it.
 *
 * @throws Error if used outside of a `<BffProvider>`.
 */
export function useBffCsrf() {
  const { csrfManager } = useBffConfig();

  const csrfToken = csrfManager.getToken();

  const refreshCsrf = useCallback(() => csrfManager.fetchToken(), [csrfManager]);

  return { csrfToken, refreshCsrf } as const;
}
