import { setTenantGetter } from '@granit/api-client';
import { resolveTenant } from '@granit/multi-tenancy';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import type { CurrentTenant, MultiTenancyOptions, TenantResolver } from '@granit/multi-tenancy';
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
   * Fired when the resolved tenant id changes (not on mount). Use to clear
   * tenant-scoped caches — typically `queryClient.clear()` — to prevent
   * cross-tenant data leakage via stale React Query entries.
   *
   * @example
   * ```tsx
   * const queryClient = useQueryClient();
   * <TenantProvider
   *   resolvers={resolvers}
   *   onTenantChange={() => queryClient.clear()}
   * >...</TenantProvider>
   * ```
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

  useEffect(() => {
    const previous = previousTenantIdRef.current;
    if (previous !== tenant.tenantId) {
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
