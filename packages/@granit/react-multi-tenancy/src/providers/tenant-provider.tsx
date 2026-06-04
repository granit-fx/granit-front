import { setTenantGetter } from '@granit/api-client';
import { resolveTenant } from '@granit/multi-tenancy';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import type { CurrentTenant, MultiTenancyOptions, TenantResolver } from '@granit/multi-tenancy';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const NO_TENANT: CurrentTenant = {
  isAvailable: false,
  tenantId: undefined,
  tenantName: undefined,
};

export interface TenantProviderProps {
  /** Ordered list of tenant resolvers. */
  readonly resolvers: readonly TenantResolver[];
  /** Multi-tenancy options. */
  readonly options?: MultiTenancyOptions;
  /**
   * React Query client to clear automatically whenever the active tenant id
   * changes (cleared *before* `onTenantChange` runs, never on initial mount).
   *
   * Passing this is the recommended **fail-safe** against cross-tenant cache
   * leakage: query keys are not tenant-partitioned, so without a clear, a
   * tenant-A response can be served briefly under tenant-B after an in-place
   * switch. One prop removes the need to remember `useClearQueriesOnTenantChange`
   * or to wire `onTenantChange` by hand. See security audit VULN-200.
   *
   * @example
   * ```tsx
   * const queryClient = useQueryClient();
   * <TenantProvider resolvers={resolvers} queryClient={queryClient}>...</TenantProvider>
   * ```
   */
  readonly queryClient?: QueryClient;
  /**
   * Fired when the resolved tenant id changes (not on mount). Use for custom
   * side effects on tenant switch. For cache isolation, prefer `queryClient`
   * above — it is applied automatically and cannot be forgotten.
   */
  readonly onTenantChange?: (
    tenantId: string | undefined,
    previousTenantId: string | undefined
  ) => void;
  readonly children: ReactNode;
}

const TenantContext = createContext<CurrentTenant | null>(null);

export function TenantProvider({
  resolvers,
  options,
  queryClient,
  onTenantChange,
  children,
}: Readonly<TenantProviderProps>): React.JSX.Element {
  const isEnabled = options?.isEnabled !== false;

  const tenant: CurrentTenant = useMemo(() => {
    if (!isEnabled) return NO_TENANT;

    const resolved = resolveTenant(resolvers);
    if (resolved) {
      return { isAvailable: true, tenantId: resolved.id, tenantName: resolved.name };
    }
    return NO_TENANT;
  }, [resolvers, isEnabled]);

  const tenantRef = useRef(tenant);
  tenantRef.current = tenant;

  useEffect(() => {
    if (!isEnabled) return;
    setTenantGetter(() => tenantRef.current.tenantId);
  }, [isEnabled]);

  const previousTenantIdRef = useRef<string | undefined>(tenant.tenantId);
  const onTenantChangeRef = useRef(onTenantChange);
  onTenantChangeRef.current = onTenantChange;
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    const previous = previousTenantIdRef.current;
    if (previous !== tenant.tenantId) {
      // Fail-safe: drop tenant-A cache entries before tenant-B renders, so a
      // stale (un-partitioned) query key cannot leak across the boundary.
      queryClientRef.current?.clear();
      onTenantChangeRef.current?.(tenant.tenantId, previous);
      previousTenantIdRef.current = tenant.tenantId;
    }
  }, [tenant.tenantId]);

  return <TenantContext value={tenant}>{children}</TenantContext>;
}

/**
 * Returns the current tenant from the nearest TenantProvider.
 *
 * @throws Error if called outside a TenantProvider.
 */
export function useTenant(): CurrentTenant {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return ctx;
}
