import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useTenant } from '../providers/tenant-provider.js';

/**
 * Clears the React Query cache whenever the active tenant id changes.
 *
 * Must be mounted **inside** both a `<QueryClientProvider>` and a
 * `<TenantProvider>`. Prevents tenant-A responses from being served briefly
 * under a tenant-B context after the user switches tenants — a confidentiality
 * issue tracked by the framework's security audit.
 *
 * Prefer wiring this hook (or passing `onTenantChange={() => queryClient.clear()}`
 * to `<TenantProvider>`) in every multi-tenant app.
 *
 * @example
 * ```tsx
 * function App() {
 *   useClearQueriesOnTenantChange();
 *   return <Routes />;
 * }
 * ```
 */
export function useClearQueriesOnTenantChange(): void {
  const queryClient = useQueryClient();
  const tenant = useTenant();
  const previousTenantIdRef = useRef<string | undefined>(tenant.tenantId);

  useEffect(() => {
    const previous = previousTenantIdRef.current;
    if (previous !== tenant.tenantId) {
      queryClient.clear();
      previousTenantIdRef.current = tenant.tenantId;
    }
  }, [tenant.tenantId, queryClient]);
}
