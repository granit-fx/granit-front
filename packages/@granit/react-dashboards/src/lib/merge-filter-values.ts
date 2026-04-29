import type { DashboardFilterValues } from '../components/dashboard-filter-context.js';
import type { DashboardRenderRequest } from '@granit/dashboards';

/**
 * Folds live {@link DashboardFilterValues} into a
 * {@link DashboardRenderRequest}. Keys whose value is `null` are
 * dropped — matches the backend's "no filter applied" semantics,
 * different from passing an empty string (which would request
 * `Field eq ""`).
 *
 * Existing `request.filters` entries are merged with live values
 * winning on key conflict — apps that pre-populate
 * `request.filters` (e.g. tenant-scoped silent filters from the
 * route loader) get those values overridden by user-driven toolbar
 * input, which is the expected UX.
 *
 * Pure function, no React deps.
 */
export function mergeFilterValuesIntoRequest(
  request: DashboardRenderRequest,
  values: DashboardFilterValues | null | undefined
): DashboardRenderRequest {
  if (!values || Object.keys(values).length === 0) return request;

  const merged: Record<string, string> = { ...(request.filters ?? {}) };
  for (const [name, value] of Object.entries(values)) {
    if (value === null) {
      delete merged[name];
      continue;
    }
    merged[name] = value;
  }
  return Object.keys(merged).length > 0 ? { ...request, filters: merged } : request;
}
