import { useGranitClient } from '@granit/react-api-client';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { dashboardDetailQueryKey } from './use-dashboard-detail.js';

import type { DashboardMetadataUpdateRequest, DashboardSummaryResponse } from '@granit/dashboards';

const DASHBOARDS_PATH = '/api/v1/dashboards';

/**
 * Variables passed to `useUpdateDashboardMetadata().mutate()` —
 * the persisted dashboard's id plus the new metadata payload.
 */
export interface UpdateDashboardMetadataVariables {
  readonly id: string;
  readonly request: DashboardMetadataUpdateRequest;
}

/**
 * `PUT /dashboards/{id:guid}` — updates the editable metadata
 * (name + grid layout) of a persisted dashboard. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardMetadataEditEndpoints`.
 *
 * Status, source-definition fields, and the widget pool are
 * **immutable** through this endpoint — those are managed via the
 * lifecycle / widget endpoints (see {@link usePublishDashboard},
 * {@link useArchiveDashboard}, {@link useAddWidget}, etc.).
 *
 * Returns the updated {@link DashboardSummaryResponse} so the cache
 * can be refreshed without a follow-up fetch.
 */
export function useUpdateDashboardMetadata(): UseMutationResult<
  DashboardSummaryResponse,
  Error,
  UpdateDashboardMetadataVariables
> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, request }: UpdateDashboardMetadataVariables) => {
      const { data } = await api.put<DashboardSummaryResponse>(
        `${DASHBOARDS_PATH}/${encodeURIComponent(id)}`,
        request
      );
      return data;
    },
    onSuccess: async (_summary, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboards', 'list'] }),
        queryClient.invalidateQueries({ queryKey: dashboardDetailQueryKey(id) }),
      ]);
    },
  });
}
