import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useDashboardsConfig } from '../providers/dashboards-provider.js';

import type { DashboardStatus, DashboardSummaryResponse, PagedResponse } from '@granit/dashboards';

export interface UseDashboardListParams {
  /** Filter by lifecycle state. `undefined` = all statuses. */
  readonly status?: DashboardStatus;
  /** Zero-based page index. Backend default: 0. */
  readonly page?: number;
  /** Page size. Backend default: 50, capped at 200. */
  readonly pageSize?: number;
}

/**
 * Cache key composer for the persisted-dashboard list. The params get
 * baked into the key so each filter / page combination caches
 * independently.
 */
export const dashboardListQueryKey = (params: UseDashboardListParams) =>
  ['dashboards', 'list', params] as const;

/**
 * `GET /dashboards/?status=&page=&pageSize=` — returns a paged list of
 * the tenant's persisted dashboards. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardInstanceEndpoints.ListAsync`.
 *
 * Multi-tenant filter is applied server-side; cross-tenant rows are
 * never reachable.
 */
export function useDashboardList(
  params: UseDashboardListParams = {},
  options: { readonly enabled?: boolean } = {}
): UseQueryResult<PagedResponse<DashboardSummaryResponse>> {
  const { client, basePath } = useDashboardsConfig();
  return useQuery({
    queryKey: dashboardListQueryKey(params),
    queryFn: async ({ signal }) => {
      const { data } = await client.get<PagedResponse<DashboardSummaryResponse>>(basePath, {
        signal,
        params: {
          status: params.status,
          page: params.page,
          pageSize: params.pageSize,
        },
      });
      return data;
    },
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
}
