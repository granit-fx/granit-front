import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Read-only ambient context for a rendered dashboard. Surfaces the dashboard
 * identity so renderers (and future hooks for TimeWindow / aliases / filters)
 * have a stable handle without prop-drilling.
 *
 * Today the only field is `dashboardName`; the type is the extension point
 * where TimeWindow / EntityAlias / DashboardFilters land in later stories
 * (see proposals doc P1.3 / P2.3 / P2.5).
 */
export interface DashboardContextValue {
  /** Wire identifier of the active dashboard, e.g. `"Granit.Invoicing.FinanceOverview"`. */
  readonly dashboardName: string;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export interface DashboardContextProviderProps {
  readonly value: DashboardContextValue;
  readonly children: ReactNode;
}

export function DashboardContextProvider({ value, children }: DashboardContextProviderProps) {
  const memoised = useMemo(() => value, [value.dashboardName]);
  return <DashboardContext.Provider value={memoised}>{children}</DashboardContext.Provider>;
}

/**
 * Reads the active {@link DashboardContextValue}. Returns `null` outside a
 * provider — useful for renderers that gracefully degrade when used
 * standalone (a KPI tile rendered above an invoice list, for instance).
 */
export function useDashboardContext(): DashboardContextValue | null {
  return useContext(DashboardContext);
}
