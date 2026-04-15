import { useMemo } from 'react';

import { useBffConfig } from '../providers/bff-provider.js';

/**
 * Hook that returns a `fetch` wrapper with automatic CSRF token injection
 * on mutation requests (POST, PUT, DELETE, PATCH) and `credentials: 'include'`.
 *
 * @throws Error if used outside of a `<BffProvider>`.
 */
export function useBffFetch() {
  const { csrfManager } = useBffConfig();
  return useMemo(() => csrfManager.createFetchWithCsrf(), [csrfManager]);
}
