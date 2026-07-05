import { listDashboardCatalog } from '@granit/dashboards';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useDashboardsConfig } from '../providers/dashboards-provider';

import { dashboardsKeys } from './query-keys';

import type { DashboardCatalogEntryResponse, DashboardCategory } from '@granit/dashboards';

/**
 * `GET /dashboards/catalog?category=` — returns the catalog of available
 * `DashboardDefinition` descriptors (B4 catalog endpoint, mirrors
 * `Granit.Dashboards.Endpoints.DashboardCatalogEndpoints`). Each entry is
 * a {@link DashboardCatalogEntryResponse} carrying the metadata needed to
 * render the import dialog (name, category, version, widget count, +
 * feature flags `hasViews` / `hasAliases` / `hasFilters`).
 *
 * Long staleTime — the catalog is shaped by the host's module DI graph
 * and only changes on deployments.
 */
export function useDashboardCatalog(
  options: { readonly enabled?: boolean; readonly category?: DashboardCategory } = {}
): UseQueryResult<readonly DashboardCatalogEntryResponse[]> {
  const { client, basePath } = useDashboardsConfig();
  const { enabled = true, category } = options;
  return useQuery({
    queryKey: dashboardsKeys.catalog(category),
    queryFn: ({ signal }) => listDashboardCatalog(client, basePath, { category }, { signal }),
    enabled,
    staleTime: 5 * 60_000,
  });
}
