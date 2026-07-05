import { listDashboards } from '@granit/dashboards';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useDashboardsConfig } from '../providers/dashboards-provider';

import { dashboardsKeys } from './query-keys';

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
    queryKey: dashboardsKeys.list(params),
    queryFn: ({ signal }) => listDashboards(client, basePath, params, { signal }),
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
}
