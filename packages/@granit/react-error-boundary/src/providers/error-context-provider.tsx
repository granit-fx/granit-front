import * as React from 'react';

import type { Breadcrumb, ErrorContextConfig, ErrorContextValue } from '@granit/error-boundary';
import type { LogContext } from '@granit/logger';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/**
 * Error context shared with `GranitErrorBoundary` and `GlobalErrorCapture` so
 * caught errors are enriched with the current route, user, and breadcrumb
 * trail. Package-internal — consumers read it through `useErrorBoundaryConfig`
 * / `useBreadcrumb`, never the raw context object.
 */
export const ErrorContext = React.createContext<ErrorContextValue | null>(null);

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

/**
 * Projects the error context into a flat {@link LogContext} attached to every
 * error logged by `GranitErrorBoundary` / `GlobalErrorCapture`. Returns an
 * empty object when no `ErrorContextProvider` is mounted, so both components
 * remain usable standalone.
 */
export function collectErrorContext(context: ErrorContextValue | null): LogContext {
  if (!context) return {};

  const enrichment: LogContext = {};

  const route = context.getRouteInfo();
  if (route !== undefined) enrichment.route = route;

  const user = context.getUserInfo();
  if (user !== undefined) enrichment.userId = user.id;

  if (context.breadcrumbs.length > 0) enrichment.breadcrumbs = context.breadcrumbs;

  return enrichment;
}

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
