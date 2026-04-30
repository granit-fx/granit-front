import { useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import {
  dashboardRenderQueryKey,
  dashboardWidgetQueryKey,
  useDashboardRender,
  type UseDashboardRenderOptions,
} from './use-dashboard-render.js';
import {
  applyStreamSnapshot,
  useDashboardStream,
  type DashboardStreamSnapshot,
} from './use-dashboard-stream.js';

import type {
  DashboardRenderedWidget,
  DashboardRenderRequest,
  DashboardRenderResponse,
} from '@granit/dashboards';

/**
 * Composition hook that pairs the seed pull
 * (`POST /dashboards/{id}/render`) with the live SSE stream
 * (`GET /dashboards/{id}/stream`). ADR-043 §6 frontend-side closure:
 *
 * 1. Calls {@link useDashboardRender} for the seed bundle. Per-widget
 *    cache entries are populated as usual (ADR-039 §6.2).
 * 2. If any widget in the seed carries `transport === 'Push'`,
 *    subscribes to the stream via {@link useDashboardStream}.
 * 3. Each `event: snapshot` frame surgically updates the matching
 *    per-widget cache entry via `setQueryData(dashboardWidgetQueryKey)`.
 *    Structural fields (slug, position, width, height, title, actions,
 *    requiredPermission, transport) survive the merge — the stream
 *    only carries the dynamic projection.
 * 4. On `event: resume-failed` (the client's `Last-Event-ID` is past
 *    the server's ring buffer) the seed render query is invalidated
 *    so `useDashboardRender` refetches a fresh bundle.
 *
 * Pull-only dashboards bypass the stream entirely — the hook
 * collapses to a plain {@link useDashboardRender}. Hosts that don't
 * load `Granit.Dashboards.Push` always see `transport: 'Pull'` (or
 * the field absent) on every widget, so this hook is safe to use
 * unconditionally — opening a stream is opt-in via the bundle's
 * `transport` field.
 */
export function usePushedDashboard(
  dashboardId: string,
  request: DashboardRenderRequest = {},
  options: UseDashboardRenderOptions = {}
): UseQueryResult<DashboardRenderResponse> {
  const queryClient = useQueryClient();
  const result = useDashboardRender(dashboardId, request, options);

  const hasPushWidget = useMemo(
    () => (result.data?.widgets ?? []).some((widget) => widget.transport === 'Push'),
    [result.data]
  );

  const handleSnapshot = useCallback(
    (event: DashboardStreamSnapshot) => {
      queryClient.setQueryData<DashboardRenderedWidget>(
        dashboardWidgetQueryKey(dashboardId, event.widgetId),
        (current) => applyStreamSnapshot(current, event)
      );
    },
    [queryClient, dashboardId]
  );

  const handleResumeFailed = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: dashboardRenderQueryKey(dashboardId, request),
    });
  }, [queryClient, dashboardId, request]);

  useDashboardStream(dashboardId, {
    enabled: hasPushWidget,
    onSnapshot: handleSnapshot,
    onResumeFailed: handleResumeFailed,
  });

  return result;
}
