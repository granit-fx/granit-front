import { importDashboard } from '@granit/dashboards';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { logger } from '../logger';
import { useDashboardsConfig } from '../providers/dashboards-provider';

import { dashboardDetailQueryKey } from './use-dashboard-detail';

import type { DashboardImportResponse } from '@granit/dashboards';

/**
 * `POST /dashboards/from-definition/{name}` — imports a dashboard
 * definition from the catalog into the tenant's persisted-instance
 * pool. Mirrors `Granit.Dashboards.Endpoints.DashboardImportEndpoints`.
 *
 * The created `Dashboard` aggregate starts in `Draft` status — the
 * caller decides when to publish it via {@link usePublishDashboard}.
 *
 * Side effects on success:
 * - Invalidates every list-page query so the new dashboard surfaces
 *   without a manual refetch.
 * - Pre-seeds the per-id detail cache (best-effort; the import response
 *   carries summary fields, not the full widget tree, so the editor
 *   still triggers a fresh fetch).
 */
export function useImportDashboard(): UseMutationResult<DashboardImportResponse, Error, string> {
  const { client, basePath } = useDashboardsConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (definitionName: string) => importDashboard(client, basePath, definitionName),
    onSuccess: async (imported) => {
      logger.debug('Dashboard imported', {
        id: imported.id,
        source: imported.sourceDefinitionName,
      });
      // Drop any stale detail cache for the freshly imported id (most
      // likely none, but cheap to clear).
      queryClient.removeQueries({ queryKey: dashboardDetailQueryKey(imported.id) });
      await queryClient.invalidateQueries({ queryKey: ['dashboards', 'list'] });
    },
  });
}
