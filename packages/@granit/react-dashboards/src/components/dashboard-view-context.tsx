import { createContext, useContext } from 'react';

/**
 * Active-view state surfaced to consumers — widget renderers,
 * action-trigger handlers (`WidgetActionKind.OpenDashboardView`),
 * breadcrumb components, view switchers.
 *
 * `currentView` is `null` for single-view dashboards. `setCurrentView`
 * always exists so action handlers can call it unconditionally; on
 * single-view dashboards it's a no-op upstream.
 */
export interface DashboardViewContextValue {
  /** Active view name, or `null` for single-view dashboards. */
  readonly currentView: string | null;
  /** Switch to a named view. No-op on single-view dashboards. */
  readonly setCurrentView: (name: string) => void;
}

const DashboardViewContext = createContext<DashboardViewContextValue | null>(null);

export interface DashboardViewProviderProps {
  readonly value: DashboardViewContextValue;
  readonly children: React.ReactNode;
}

/**
 * Provider for the active dashboard view. `<Dashboard>` /
 * `<EditableDashboard>` mount this internally; downstream hooks
 * (`useDashboardView`) read it.
 *
 * Apps wanting URL-bound views (`/dashboards/{name}/view/{viewName}`)
 * lift the controlled state up and feed both `value` here and
 * `<Dashboard currentView ...>` from the same source.
 */
export function DashboardViewProvider({ value, children }: DashboardViewProviderProps) {
  return <DashboardViewContext.Provider value={value}>{children}</DashboardViewContext.Provider>;
}

/**
 * Reads the active view state. Returns `null` when called outside a
 * `<Dashboard>` / `<EditableDashboard>` (single-widget standalone
 * usage) — callers that need a guarantee can throw, but most consumers
 * (action handlers, breadcrumbs) gracefully degrade when there's no
 * dashboard surrounding them.
 */
export function useDashboardView(): DashboardViewContextValue | null {
  return useContext(DashboardViewContext);
}
