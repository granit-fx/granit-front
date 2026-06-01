import { archiveDashboard, publishDashboard, restoreDashboard } from '@granit/dashboards';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { useDashboardsConfig } from '../providers/dashboards-provider';

import { dashboardDetailQueryKey } from './use-dashboard-detail';

/**
 * Shared invalidation routine — all three transitions affect the list
 * (status filter changes which dashboards a query returns) plus the
 * specific detail entry.
 */
async function invalidateAfterTransition(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['dashboards', 'list'] }),
    queryClient.invalidateQueries({ queryKey: dashboardDetailQueryKey(id) }),
  ]);
}

/**
 * `POST /dashboards/{id}/publish` — promotes a Draft dashboard to
 * Published, surfacing it in the catalog for users with the relevant
 * permissions. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardStateTransitionEndpoints.PublishAsync`.
 *
 * Backend rejects 400 if the dashboard is already Published or Archived.
 */
export function usePublishDashboard(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useDashboardsConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishDashboard(client, basePath, id),
    onSuccess: (_void, id) => invalidateAfterTransition(queryClient, id),
  });
}

/**
 * `POST /dashboards/{id}/archive` — hides a dashboard from the catalog
 * but keeps the row for audit / restore. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardStateTransitionEndpoints.ArchiveAsync`.
 *
 * Replaces the (non-existent) DELETE endpoint — Granit dashboards are
 * never deleted, only archived. Restore via {@link useRestoreDashboard}.
 */
export function useArchiveDashboard(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useDashboardsConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveDashboard(client, basePath, id),
    onSuccess: (_void, id) => invalidateAfterTransition(queryClient, id),
  });
}

/**
 * `POST /dashboards/{id}/restore` — moves an Archived dashboard back to
 * Draft. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardStateTransitionEndpoints.RestoreAsync`.
 */
export function useRestoreDashboard(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useDashboardsConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreDashboard(client, basePath, id),
    onSuccess: (_void, id) => invalidateAfterTransition(queryClient, id),
  });
}
