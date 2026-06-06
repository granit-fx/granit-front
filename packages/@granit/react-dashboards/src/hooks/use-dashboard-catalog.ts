import { getDashboardCatalog } from '@granit/dashboards';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useDashboardsConfig } from '../providers/dashboards-provider';

import type { DashboardCatalogEntryResponse, DashboardCategory } from '@granit/dashboards';

/**
 * Cache key for the dashboard catalog. Keyed by category so per-category
 * queries stay isolated from the full-catalog fetch.
 */
export const dashboardCatalogQueryKey = (category?: DashboardCategory) =>
  category ? (['dashboards', 'catalog', category] as const) : (['dashboards', 'catalog'] as const);

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
    queryKey: dashboardCatalogQueryKey(category),
    queryFn: ({ signal }) => getDashboardCatalog(client, basePath, { category }, { signal }),
    enabled,
    staleTime: 5 * 60_000,
  });
}
