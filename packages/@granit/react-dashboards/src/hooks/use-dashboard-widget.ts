import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { dashboardWidgetQueryKey } from './use-dashboard-render.js';

import type { DashboardRenderedWidget } from '@granit/dashboards';

/**
 * Reads a single widget's envelope from the per-widget TanStack cache entry
 * populated by {@link useDashboardRender}. Per ADR-039 §6.2 the bundle
 * fetch and the per-widget cache split are decoupled, so:
 *
 * - `useDashboardRender` triggers the network round-trip and refreshes
 *   every widget atomically.
 * - `useDashboardWidget` is a **passive reader** — it never fires its own
 *   network request. The future SSE / WS push transport (P2.4) updates the
 *   per-widget entry directly via `setQueryData`, and consumers re-render
 *   only for the specific widget that changed.
 *
 * Returns a TanStack `UseQueryResult` with `data: undefined` whenever the
 * bundle has not been fetched yet (or the widget id is unknown). Consumers
 * typically render a placeholder until `data` is populated.
 */
export function useDashboardWidget(
  dashboardId: string,
  widgetId: string
): UseQueryResult<DashboardRenderedWidget> {
  return useQuery<DashboardRenderedWidget>({
    queryKey: dashboardWidgetQueryKey(dashboardId, widgetId),
    // No queryFn — the bundle fetch (`useDashboardRender`) is the sole
    // source of truth. Setting `enabled: false` keeps TanStack from
    // attempting a fetch and surfaces the cached entry verbatim.
    enabled: false,
  });
}
