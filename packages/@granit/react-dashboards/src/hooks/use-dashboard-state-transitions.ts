import { archiveDashboard, publishDashboard, restoreDashboard } from '@granit/dashboards';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { logger } from '../logger';
import { useDashboardsConfig } from '../providers/dashboards-provider';

import { dashboardsKeys } from './query-keys';

import type { DashboardSummaryResponse, PagedResponse } from '@granit/dashboards';

/**
 * Patch the in-memory list cache immediately with the returned summary so
 * the status badge flips before the background refetch completes. The list
 * is still invalidated below to handle status-filter pages.
 */
function patchListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  summary: DashboardSummaryResponse
): void {
  queryClient.setQueriesData<PagedResponse<DashboardSummaryResponse>>(
    { queryKey: ['dashboards', 'list'] },
    (old) => {
      if (!old) return old;
      return { ...old, items: old.items.map((item) => (item.id === summary.id ? summary : item)) };
    }
  );
}

/**
 * Invalidate both the list (status filter changes the visible set) and the
 * specific detail entry after a state transition.
 */
async function invalidateAfterTransition(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['dashboards', 'list'] }),
    queryClient.invalidateQueries({ queryKey: dashboardsKeys.detail(id) }),
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
export function usePublishDashboard(): UseMutationResult<DashboardSummaryResponse, Error, string> {
  const { client, basePath } = useDashboardsConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishDashboard(client, basePath, id),
    onSuccess: (summary, id) => {
      logger.debug('Dashboard published', { id });
      patchListCache(queryClient, summary);
      return invalidateAfterTransition(queryClient, id);
    },
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
export function useArchiveDashboard(): UseMutationResult<DashboardSummaryResponse, Error, string> {
  const { client, basePath } = useDashboardsConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveDashboard(client, basePath, id),
    onSuccess: (summary, id) => {
      logger.debug('Dashboard archived', { id });
      patchListCache(queryClient, summary);
      return invalidateAfterTransition(queryClient, id);
    },
  });
}

/**
 * `POST /dashboards/{id}/restore` — moves an Archived dashboard back to
 * Draft. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardStateTransitionEndpoints.RestoreAsync`.
 */
export function useRestoreDashboard(): UseMutationResult<DashboardSummaryResponse, Error, string> {
  const { client, basePath } = useDashboardsConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreDashboard(client, basePath, id),
    onSuccess: (summary, id) => {
      logger.debug('Dashboard restored', { id });
      patchListCache(queryClient, summary);
      return invalidateAfterTransition(queryClient, id);
    },
  });
}
