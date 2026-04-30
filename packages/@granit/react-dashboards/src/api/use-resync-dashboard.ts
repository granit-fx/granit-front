import { useGranitClient } from '@granit/react-api-client';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { dashboardDetailQueryKey } from './use-dashboard-detail.js';

import type { DashboardResyncResponse } from '@granit/dashboards';

const DASHBOARDS_PATH = '/dashboards';

/**
 * `POST /dashboards/{id}/resync` — replays the registered
 * `DashboardDefinition` behind a persisted dashboard's
 * `sourceDefinitionName`. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardResyncEndpoints.ResyncAsync`
 * (ADR-038 §3).
 *
 * Resolves the drift surface: the render endpoint surfaces a
 * `'Behind'` / `'Ahead'` `driftStatus`, this mutation is the action the
 * "click to resync" affordance dispatches.
 *
 * The backend preserves the user-renamable `name` and lifecycle
 * `status` and best-effort carries persisted overrides via
 * `Widget:{Name}.{slug}` match. Returns a change-summary so callers can
 * surface "X widgets added, Y removed, Z overrides preserved" toasts.
 *
 * Backend rejects 409 on ad-hoc dashboards (no source definition) and
 * when the source definition is no longer registered in the host.
 *
 * Invalidates the dashboard list (drift status flips to `'Aligned'`),
 * the per-id detail (widgets and version refresh), and the per-id
 * render bundle so subsequent reads hit fresh data.
 */
export function useResyncDashboard(): UseMutationResult<DashboardResyncResponse, Error, string> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<DashboardResyncResponse>(
        `${DASHBOARDS_PATH}/${encodeURIComponent(id)}/resync`
      );
      return response.data;
    },
    onSuccess: (_response, id) => {
      void queryClient.invalidateQueries({ queryKey: ['dashboards', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboards', 'catalog'] });
      void queryClient.invalidateQueries({ queryKey: dashboardDetailQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', id, 'render'] });
    },
  });
}
