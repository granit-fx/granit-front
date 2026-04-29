import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { DashboardDetailResponse } from '@granit/dashboards';

const DASHBOARDS_PATH = '/dashboards';

/**
 * Cache key for a single persisted dashboard, keyed by its Guid. Used by
 * the editor + by the lifecycle-mutation hooks to invalidate the right
 * entry after archive / publish / metadata edits.
 */
export const dashboardDetailQueryKey = (id: string) => ['dashboards', 'detail', id] as const;

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
  const api = useGranitClient();
  return useQuery({
    queryKey: dashboardDetailQueryKey(id),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<DashboardDetailResponse>(
        `${DASHBOARDS_PATH}/${encodeURIComponent(id)}`,
        { signal }
      );
      return data;
    },
    enabled: (options.enabled ?? true) && id.length > 0,
    staleTime: 60_000,
  });
}
