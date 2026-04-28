import { DASHBOARD_TIME_WINDOW } from '@granit/dashboards';

import { useDashboardContext } from '../components/dashboard-context.js';

import type { DashboardTimeWindow } from '@granit/dashboards';

/**
 * Resolves the time window in effect for the calling widget. The cascade is:
 *
 * 1. Explicit override passed in by the caller (e.g. a widget with its own
 *    `TimeWindowOverride` per proposals doc P1.3).
 * 2. Active dashboard time window from {@link useDashboardContext}.
 * 3. The framework default (`DASHBOARD_TIME_WINDOW.Last30Days`) so widgets
 *    rendered standalone get a sensible value without ceremony.
 *
 * Always returns a defined `DashboardTimeWindow` — callers don't have to
 * juggle `undefined`.
 */
export function useEffectiveTimeWindow(override?: DashboardTimeWindow): DashboardTimeWindow {
  const context = useDashboardContext();
  return override ?? context?.timeWindow ?? DASHBOARD_TIME_WINDOW.Last30Days;
}
