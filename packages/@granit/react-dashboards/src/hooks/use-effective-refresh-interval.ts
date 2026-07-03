import { useDashboardContext } from '../components/dashboard-context';

import type { DashboardRefreshInterval } from '@granit/dashboards';

/**
 * Resolves the auto-refresh cadence in effect for the calling widget. Cascade:
 *
 * 1. Explicit `override` passed by the caller.
 * 2. The active dashboard cadence from {@link useDashboardContext}.
 * 3. `'auto'` — each data source keeps its own natural cadence.
 *
 * Always returns a defined {@link DashboardRefreshInterval}; pair with
 * `toRefetchInterval` to feed a TanStack Query `refetchInterval`.
 */
export function useEffectiveRefreshInterval(
  override?: DashboardRefreshInterval
): DashboardRefreshInterval {
  const context = useDashboardContext();
  return override ?? context?.refreshInterval ?? 'auto';
}
