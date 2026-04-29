import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { DashboardCatalogEntryResponse } from '@granit/dashboards';

const CATALOG_PATH = '/dashboards/catalog';

/**
 * Cache key for the dashboard catalog. Distinct from the persisted-instance
 * keys ({@link dashboardListQueryKey} / {@link dashboardDetailQueryKey})
 * because the catalog and the instance pool are independent: the catalog
 * lists *available definitions* the user can import; the list lists
 * *imported instances* the user already owns.
 */
export const dashboardCatalogQueryKey = () => ['dashboards', 'catalog'] as const;

/**
 * `GET /dashboards/catalog` — returns the catalog of available
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
  options: { readonly enabled?: boolean } = {}
): UseQueryResult<readonly DashboardCatalogEntryResponse[]> {
  const api = useGranitClient();
  return useQuery({
    queryKey: dashboardCatalogQueryKey(),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<readonly DashboardCatalogEntryResponse[]>(CATALOG_PATH, {
        signal,
      });
      return data;
    },
    enabled: options.enabled ?? true,
    staleTime: 5 * 60_000,
  });
}
