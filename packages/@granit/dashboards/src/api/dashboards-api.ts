import type {
  DashboardRenderedWidget,
  DashboardRenderRequest,
  DashboardRenderResponse,
} from '../rendering/index.js';
import type {
  AddWidgetRequest,
  DashboardCatalogEntryResponse,
  DashboardDetailResponse,
  DashboardImportResponse,
  DashboardMetadataUpdateRequest,
  DashboardResyncResponse,
  DashboardStatus,
  DashboardSummaryResponse,
  PagedResponse,
  UpdateWidgetRequest,
  WidgetDefinitionBase,
  WidgetInstanceResponse,
} from '../types/index.js';
import type { AxiosInstance, AxiosRequestConfig } from '@granit/api-client';

/**
 * Optional per-call request options forwarded to axios. Restricted to the
 * fields the dashboards hooks need (notably `signal` for React Query
 * cancellation). Avoids importing the full `AxiosRequestConfig` surface at
 * each call site.
 */
export type DashboardsRequestOptions = Pick<AxiosRequestConfig, 'signal'>;

/**
 * Query params accepted by `GET {basePath}/`.
 */
export interface DashboardListParams {
  /** Filter by lifecycle state. `undefined` = all statuses. */
  readonly status?: DashboardStatus;
  /** Zero-based page index. Backend default: 0. */
  readonly page?: number;
  /** Page size. Backend default: 50, capped at 200. */
  readonly pageSize?: number;
}

/**
 * Body for `POST {widgetsBasePath}/{kind}/render` — the per-widget render
 * endpoints (P3, symmetric with the bundle path).
 */
export interface WidgetRenderBody<TDefinition extends WidgetDefinitionBase> {
  readonly definition: TDefinition;
  readonly context: WidgetRenderContextPayload;
}

/**
 * Context passed alongside the widget definition to the per-widget render
 * endpoints. Same shape as the dashboard-level
 * {@link DashboardRenderRequest} minus the dashboard-scoped fields.
 */
export interface WidgetRenderContextPayload {
  readonly periodFrom?: string;
  readonly periodTo?: string;
  readonly periodToken?: string;
  readonly locale?: string;
  readonly filters?: Readonly<Record<string, string>> | null;
}

/**
 * Wire-format kinds accepted by the per-widget render endpoints.
 */
export type WidgetRenderKind = 'kpi' | 'chart' | 'table' | 'pivot' | 'map';

/**
 * `GET {basePath}/catalog` — returns the catalog of available
 * `DashboardDefinition` descriptors. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardCatalogEndpoints`.
 */
export async function getDashboardCatalog(
  client: AxiosInstance,
  basePath: string,
  options?: DashboardsRequestOptions
): Promise<readonly DashboardCatalogEntryResponse[]> {
  const response = await client.get<readonly DashboardCatalogEntryResponse[]>(
    `${basePath}/catalog`,
    options
  );
  return response.data;
}

/**
 * `GET {basePath}/?status=&page=&pageSize=` — returns a paged list of the
 * tenant's persisted dashboards. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardInstanceEndpoints.ListAsync`.
 */
export async function listDashboards(
  client: AxiosInstance,
  basePath: string,
  params: DashboardListParams = {},
  options?: DashboardsRequestOptions
): Promise<PagedResponse<DashboardSummaryResponse>> {
  const response = await client.get<PagedResponse<DashboardSummaryResponse>>(basePath, {
    ...options,
    params: {
      status: params.status,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
  return response.data;
}

/**
 * `GET {basePath}/{id}` — returns the full payload for one persisted
 * dashboard (summary fields + ordered widget pool). Mirrors
 * `Granit.Dashboards.Endpoints.DashboardInstanceEndpoints.ReadByIdAsync`.
 */
export async function getDashboard(
  client: AxiosInstance,
  basePath: string,
  id: string,
  options?: DashboardsRequestOptions
): Promise<DashboardDetailResponse> {
  const response = await client.get<DashboardDetailResponse>(
    `${basePath}/${encodeURIComponent(id)}`,
    options
  );
  return response.data;
}

/**
 * `POST {basePath}/{id}/render` — returns the rendered bundle for a
 * persisted dashboard.
 */
export async function renderDashboard(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: DashboardRenderRequest,
  options?: DashboardsRequestOptions
): Promise<DashboardRenderResponse> {
  const response = await client.post<DashboardRenderResponse>(
    `${basePath}/${encodeURIComponent(id)}/render`,
    request,
    options
  );
  return response.data;
}

/**
 * `POST {basePath}/{id}/publish` — promotes a Draft dashboard to Published.
 * Mirrors
 * `Granit.Dashboards.Endpoints.DashboardStateTransitionEndpoints.PublishAsync`.
 */
export async function publishDashboard(
  client: AxiosInstance,
  basePath: string,
  id: string,
  options?: DashboardsRequestOptions
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(id)}/publish`, undefined, options);
}

/**
 * `POST {basePath}/{id}/archive` — hides a dashboard from the catalog but
 * keeps the row for audit / restore. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardStateTransitionEndpoints.ArchiveAsync`.
 */
export async function archiveDashboard(
  client: AxiosInstance,
  basePath: string,
  id: string,
  options?: DashboardsRequestOptions
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(id)}/archive`, undefined, options);
}

/**
 * `POST {basePath}/{id}/restore` — moves an Archived dashboard back to
 * Draft. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardStateTransitionEndpoints.RestoreAsync`.
 */
export async function restoreDashboard(
  client: AxiosInstance,
  basePath: string,
  id: string,
  options?: DashboardsRequestOptions
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(id)}/restore`, undefined, options);
}

/**
 * `POST {basePath}/from-definition/{name}` — imports a dashboard definition
 * from the catalog into the tenant's persisted-instance pool. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardImportEndpoints`.
 */
export async function importDashboard(
  client: AxiosInstance,
  basePath: string,
  definitionName: string,
  options?: DashboardsRequestOptions
): Promise<DashboardImportResponse> {
  const response = await client.post<DashboardImportResponse>(
    `${basePath}/from-definition/${encodeURIComponent(definitionName)}`,
    undefined,
    options
  );
  return response.data;
}

/**
 * `POST {basePath}/{id}/resync` — replays the registered
 * `DashboardDefinition` behind a persisted dashboard's
 * `sourceDefinitionName`. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardResyncEndpoints.ResyncAsync`.
 */
export async function resyncDashboard(
  client: AxiosInstance,
  basePath: string,
  id: string,
  options?: DashboardsRequestOptions
): Promise<DashboardResyncResponse> {
  const response = await client.post<DashboardResyncResponse>(
    `${basePath}/${encodeURIComponent(id)}/resync`,
    undefined,
    options
  );
  return response.data;
}

/**
 * `PUT {basePath}/{id}` — updates the editable metadata (name + grid
 * layout) of a persisted dashboard. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardMetadataEditEndpoints`.
 */
export async function updateDashboardMetadata(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: DashboardMetadataUpdateRequest,
  options?: DashboardsRequestOptions
): Promise<DashboardSummaryResponse> {
  const response = await client.put<DashboardSummaryResponse>(
    `${basePath}/${encodeURIComponent(id)}`,
    request,
    options
  );
  return response.data;
}

/**
 * `POST {basePath}/{dashboardId}/widgets` — pins a new widget to a
 * persisted dashboard's widget pool. The server allocates the widget id.
 * Mirrors
 * `Granit.Dashboards.Endpoints.DashboardWidgetEndpoints.AddWidgetAsync`.
 */
export async function createWidget(
  client: AxiosInstance,
  basePath: string,
  dashboardId: string,
  request: AddWidgetRequest,
  options?: DashboardsRequestOptions
): Promise<WidgetInstanceResponse> {
  const response = await client.post<WidgetInstanceResponse>(
    `${basePath}/${encodeURIComponent(dashboardId)}/widgets`,
    request,
    options
  );
  return response.data;
}

/**
 * `PUT {basePath}/{dashboardId}/widgets/{widgetId}` — full replacement of a
 * widget's editable fields (layout + title + config). Mirrors
 * `Granit.Dashboards.Endpoints.DashboardWidgetEndpoints.UpdateWidgetAsync`.
 */
export async function updateWidget(
  client: AxiosInstance,
  basePath: string,
  dashboardId: string,
  widgetId: string,
  request: UpdateWidgetRequest,
  options?: DashboardsRequestOptions
): Promise<WidgetInstanceResponse> {
  const response = await client.put<WidgetInstanceResponse>(
    `${basePath}/${encodeURIComponent(dashboardId)}/widgets/${encodeURIComponent(widgetId)}`,
    request,
    options
  );
  return response.data;
}

/**
 * `DELETE {basePath}/{dashboardId}/widgets/{widgetId}` — removes a widget
 * from the pool and re-ranks remaining widgets. Mirrors
 * `Granit.Dashboards.Endpoints.DashboardWidgetEndpoints.RemoveWidgetAsync`.
 */
export async function deleteWidget(
  client: AxiosInstance,
  basePath: string,
  dashboardId: string,
  widgetId: string,
  options?: DashboardsRequestOptions
): Promise<void> {
  await client.delete(
    `${basePath}/${encodeURIComponent(dashboardId)}/widgets/${encodeURIComponent(widgetId)}`,
    options
  );
}

/**
 * `POST {widgetsBasePath}/{kind}/render` — calls the per-widget render
 * endpoint (P3 backend, symmetric with the bundle path). Returns a single
 * {@link DashboardRenderedWidget} envelope.
 *
 * Note: `widgetsBasePath` is independent of the dashboards `basePath` — it
 * targets the per-widget API (default `/api/v1/widgets`).
 */
export async function renderWidget<TDefinition extends WidgetDefinitionBase>(
  client: AxiosInstance,
  widgetsBasePath: string,
  kind: WidgetRenderKind,
  body: WidgetRenderBody<TDefinition>,
  options?: DashboardsRequestOptions
): Promise<DashboardRenderedWidget> {
  const response = await client.post<DashboardRenderedWidget>(
    `${widgetsBasePath}/${kind}/render`,
    body,
    options
  );
  return response.data;
}
