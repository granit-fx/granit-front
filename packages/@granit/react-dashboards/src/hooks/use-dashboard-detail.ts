import { getDashboard } from '@granit/dashboards';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useDashboardsConfig } from '../providers/dashboards-provider';

import { buildDashboardsQueryKey } from './query-keys';

import type { DashboardDetailResponse } from '@granit/dashboards';

/**
 * Cache key for a single persisted dashboard, keyed by its Guid. Used by
 * the editor + by the lifecycle-mutation hooks to invalidate the right
 * entry after archive / publish / metadata edits.
 *
 * @deprecated Use {@link buildDashboardsQueryKey} with the segments
 * `'dashboards', 'detail', id`. Kept as a byte-identical alias.
 */
export const dashboardDetailQueryKey = (id: string) =>
  buildDashboardsQueryKey({}, 'dashboards', 'detail', id);

/**
 * `GET /dashboards/{id:guid}` — returns the full payload for one
 * persisted dashboard (summary fields + ordered widget pool). Mirrors
 * `Granit.Dashboards.Endpoints.DashboardInstanceEndpoints.ReadByIdAsync`.
 *
 * Multi-tenant filtered — returns 404 when the id is not found in the
 * caller's tenant scope (avoids leaking the existence of cross-tenant
 * dashboards).
 */
export function useDashboardDetail(
  id: string,
  options: { readonly enabled?: boolean } = {}
): UseQueryResult<DashboardDetailResponse> {
  const { client, basePath } = useDashboardsConfig();
  return useQuery({
    queryKey: dashboardDetailQueryKey(id),
    queryFn: ({ signal }) => getDashboard(client, basePath, id, { signal }),
    enabled: (options.enabled ?? true) && id.length > 0,
    staleTime: 60_000,
  });
}
