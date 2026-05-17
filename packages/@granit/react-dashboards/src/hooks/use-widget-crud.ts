import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { useDashboardsConfig } from '../providers/dashboards-provider.js';

import { dashboardDetailQueryKey } from './use-dashboard-detail.js';

import type {
  AddWidgetRequest,
  UpdateWidgetRequest,
  WidgetInstanceResponse,
} from '@granit/dashboards';

/**
 * Variables for `useAddWidget().mutate()`.
 */
export interface AddWidgetVariables {
  /** Persisted dashboard id this widget is being pinned to. */
  readonly dashboardId: string;
  readonly request: AddWidgetRequest;
}

/**
 * Variables for `useUpdateWidget().mutate()`.
 */
export interface UpdateWidgetVariables {
  readonly dashboardId: string;
  readonly widgetId: string;
  readonly request: UpdateWidgetRequest;
}

/**
 * Variables for `useRemoveWidget().mutate()`.
 */
export interface RemoveWidgetVariables {
  readonly dashboardId: string;
  readonly widgetId: string;
}

/**
 * `POST /dashboards/{id}/widgets` — pins a new widget to a persisted
 * dashboard's widget pool. The server allocates the widget id. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardWidgetEndpoints.AddWidgetAsync`.
 *
 * On success refreshes the parent dashboard's detail cache (the widget
 * pool changed).
 */
export function useAddWidget(): UseMutationResult<
  WidgetInstanceResponse,
  Error,
  AddWidgetVariables
> {
  const { client, basePath } = useDashboardsConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dashboardId, request }: AddWidgetVariables) => {
      const { data } = await client.post<WidgetInstanceResponse>(
        `${basePath}/${encodeURIComponent(dashboardId)}/widgets`,
        request
      );
      return data;
    },
    onSuccess: (_widget, { dashboardId }) =>
      queryClient.invalidateQueries({ queryKey: dashboardDetailQueryKey(dashboardId) }),
  });
}

/**
 * `PUT /dashboards/{id}/widgets/{widgetId}` — full replacement of a
 * widget's editable fields (layout + title + config). `widgetType`,
 * `metricName`, `queryName`, and `requiredPermission` are intentionally
 * out of scope: switching kind or rebinding to a different
 * metric/query is delete + add, not edit. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardWidgetEndpoints.UpdateWidgetAsync`.
 */
export function useUpdateWidget(): UseMutationResult<
  WidgetInstanceResponse,
  Error,
  UpdateWidgetVariables
> {
  const { client, basePath } = useDashboardsConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dashboardId, widgetId, request }: UpdateWidgetVariables) => {
      const { data } = await client.put<WidgetInstanceResponse>(
        `${basePath}/${encodeURIComponent(dashboardId)}/widgets/${encodeURIComponent(widgetId)}`,
        request
      );
      return data;
    },
    onSuccess: (_widget, { dashboardId }) =>
      queryClient.invalidateQueries({ queryKey: dashboardDetailQueryKey(dashboardId) }),
  });
}

/**
 * `DELETE /dashboards/{id}/widgets/{widgetId}` — removes a widget from
 * the pool and re-ranks remaining widgets. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardWidgetEndpoints.RemoveWidgetAsync`.
 */
export function useRemoveWidget(): UseMutationResult<void, Error, RemoveWidgetVariables> {
  const { client, basePath } = useDashboardsConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dashboardId, widgetId }: RemoveWidgetVariables) => {
      await client.delete(
        `${basePath}/${encodeURIComponent(dashboardId)}/widgets/${encodeURIComponent(widgetId)}`
      );
    },
    onSuccess: (_void, { dashboardId }) =>
      queryClient.invalidateQueries({ queryKey: dashboardDetailQueryKey(dashboardId) }),
  });
}
