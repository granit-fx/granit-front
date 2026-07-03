import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import type { DashboardRefreshInterval, DashboardTimeWindow } from '@granit/dashboards';

/**
 * Read-only ambient context for a rendered dashboard. Surfaces the dashboard
 * identity plus the active time window so renderers (and future hooks for
 * aliases / filters) have a stable handle without prop-drilling.
 *
 * The shape grows progressively as proposals land: TimeWindow today (P1.3),
 * EntityAlias and DashboardFilters next (P2.3 / P2.5).
 */
export interface DashboardContextValue {
  /** Wire identifier of the active dashboard, e.g. `"Granit.Invoicing.FinanceOverview"`. */
  readonly dashboardName: string;
  /**
   * Active time window. When omitted the dashboard has no time-window control
   * (data widgets fall back to their own `TimeWindowOverride` or per-call period).
   */
  readonly timeWindow?: DashboardTimeWindow;
  /**
   * Setter the toolbar control wires to a state hook so user changes propagate
   * through context. When omitted the time window is read-only — useful for
   * embedded / preview / printable dashboards.
   */
  readonly setTimeWindow?: Dispatch<SetStateAction<DashboardTimeWindow | undefined>>;
  /**
   * Active auto-refresh cadence. When omitted, data sources keep their own
   * default cadence (equivalent to `'auto'`).
   */
  readonly refreshInterval?: DashboardRefreshInterval;
  /**
   * Setter the refresh control binds to. When omitted the cadence is read-only
   * (no refresh control shown).
   */
  readonly setRefreshInterval?: Dispatch<SetStateAction<DashboardRefreshInterval | undefined>>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export interface DashboardContextProviderProps {
  readonly value: DashboardContextValue;
  readonly children: ReactNode;
}

export function DashboardContextProvider({ value, children }: DashboardContextProviderProps) {
  const memoised = useMemo<DashboardContextValue>(
    () => value,
    // Identity-stable on the primitive fields; the setter is assumed stable
    // (typically returned from useState).
    [
      value.dashboardName,
      value.timeWindow,
      value.setTimeWindow,
      value.refreshInterval,
      value.setRefreshInterval,
    ]
  );
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

/**
 * State hook intended for the `<Dashboard>` component itself — exposes a
 * `[timeWindow, setTimeWindow]` pair the toolbar control binds to, kept in
 * React state so user changes propagate via context to every widget.
 *
 * Usage inside `<Dashboard>`:
 * ```tsx
 * const [timeWindow, setTimeWindow] = useDashboardTimeWindowState(
 *   definition.defaultTimeWindow
 * );
 *
 * <DashboardContextProvider
 *   value={{ dashboardName: definition.name, timeWindow, setTimeWindow }}
 * >
 *   <DashboardToolbar />
 *   <Grid>{...}</Grid>
 * </DashboardContextProvider>
 * ```
 */
export function useDashboardTimeWindowState(initial?: DashboardTimeWindow) {
  return useState<DashboardTimeWindow | undefined>(initial);
}

/**
 * State hook for the dashboard's auto-refresh cadence — mirrors
 * {@link useDashboardTimeWindowState}. Exposes a `[refreshInterval,
 * setRefreshInterval]` pair the refresh control binds to.
 */
export function useDashboardRefreshIntervalState(initial?: DashboardRefreshInterval) {
  return useState<DashboardRefreshInterval | undefined>(initial);
}
