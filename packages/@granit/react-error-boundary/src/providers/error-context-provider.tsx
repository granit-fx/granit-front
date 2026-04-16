import * as React from 'react';

import type { Breadcrumb, ErrorContextConfig, ErrorContextValue } from '@granit/error-boundary';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ErrorContext = React.createContext<ErrorContextValue | null>(null);

/**
 * Returns the error context value from the nearest `ErrorContextProvider`.
 *
 * @throws If called outside an `ErrorContextProvider`.
 */
export function useErrorBoundaryConfig(): ErrorContextValue {
  const ctx = React.useContext(ErrorContext);
  if (!ctx) {
    throw new Error('useErrorBoundaryConfig must be used within an ErrorContextProvider');
  }
  return ctx;
}

/** @deprecated Use useErrorBoundaryConfig instead */
export const useErrorContext = useErrorBoundaryConfig;

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Provides contextual information (route, user, breadcrumbs) that is
 * automatically attached to errors caught by `GranitErrorBoundary` and
 * `GlobalErrorCapture`.
 *
 * Breadcrumbs are stored in a circular buffer (default 20 entries, FIFO).
 *
 * @example
 * ```tsx
 * <ErrorContextProvider config={{ getRouteInfo: () => location.pathname }}>
 *   <App />
 * </ErrorContextProvider>
 * ```
 */
export function ErrorContextProvider({
  config,
  children,
}: Readonly<{
  config?: ErrorContextConfig;
  children: React.ReactNode;
}>) {
  const maxBreadcrumbs = config?.maxBreadcrumbs ?? 20;
  const [breadcrumbs, setBreadcrumbs] = React.useState<Breadcrumb[]>([]);

  const addBreadcrumb = React.useCallback(
    (category: string, message: string) => {
      const entry: Breadcrumb = {
        category,
        message,
        timestamp: new Date().toISOString(),
      };
      setBreadcrumbs((prev) => {
        const next = [...prev, entry];
        return next.length > maxBreadcrumbs ? next.slice(-maxBreadcrumbs) : next;
      });
    },
    [maxBreadcrumbs]
  );

  const getRouteInfo = React.useCallback(() => config?.getRouteInfo?.(), [config?.getRouteInfo]);

  const getUserInfo = React.useCallback(() => config?.getUserInfo?.(), [config?.getUserInfo]);

  const value = React.useMemo<ErrorContextValue>(
    () => ({ breadcrumbs, addBreadcrumb, getRouteInfo, getUserInfo }),
    [breadcrumbs, addBreadcrumb, getRouteInfo, getUserInfo]
  );

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
}
