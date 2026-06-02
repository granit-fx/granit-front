export type { AggregateFunction } from './aggregate-function';
export type { RefreshHint } from './refresh-hint';
export type { ResolvedPeriod } from './resolved-period';
export type { DataKeyFormat } from './data-key-format';
export type { DashboardCategory } from './dashboard-category';
export { DASHBOARD_TIME_WINDOW } from './dashboard-time-window';
export {
  Datasource,
  isMetricDatasource,
  isQueryAggregateDatasource,
  isTelemetryDatasource,
} from './datasource';
export type {
  MetricDatasource,
  QueryAggregateDatasource,
  TelemetryAggregation,
  TelemetryDatasource,
} from './datasource';
export type { DashboardPeriod, DashboardTimeWindow, TimeWindowKind } from './dashboard-time-window';
export type {
  DashboardDefinitionDescriptor,
  DashboardDefinitionRegistry,
} from './dashboard-definition-descriptor';
export type { DashboardDefinition } from './dashboard-definition';
export { DEFAULT_DASHBOARD_LAYOUT } from './dashboard-layout';
export type {
  DashboardBreakpoint,
  DashboardLayout,
  DashboardLayoutOverride,
} from './dashboard-layout';
export type {
  DashboardFilter,
  DashboardFilterClause,
  DashboardFilterOperation,
  DashboardFilterOperator,
} from './dashboard-filter';
export type { DashboardView } from './dashboard-view';
export {
  isRouteParamResolver,
  isStaticEntityResolver,
  isTenantContextResolver,
  isUserSelectionResolver,
  isViewEntityResolver,
} from './entity-alias';
export type {
  EntityAlias,
  EntityAliasResolver,
  RouteParamResolver,
  StaticEntityResolver,
  TenantContextResolver,
  UserSelectionResolver,
  ViewEntityResolver,
} from './entity-alias';
export { formatDurationFromMs, parseDurationToMs } from './parse-duration';
export type { WidgetAction, WidgetActionKind, WidgetActionTrigger } from './widget-action';
export type {
  FrameworkWidgetDefinition,
  ImageFit,
  ImageWidgetDefinition,
  MarkdownWidgetDefinition,
  TextWidgetDefinition,
  TextWidgetStyle,
  WidgetDefinition,
  WidgetDefinitionBase,
} from './widget-definition';
export { WIDGET_SIZE } from './widget-size';
export type { WidgetSize } from './widget-size';

// ---------------------------------------------------------------------------
// Lifecycle / persistence DTOs (B4-write — Granit.Dashboards.Endpoints).
// Distinct from `./rendering/` shapes for the render pipeline.
// ---------------------------------------------------------------------------

export type { DashboardCatalogEntryResponse } from './dashboard-catalog-entry-response';
export type { DashboardDetailResponse } from './dashboard-detail-response';
export type { DashboardImportResponse } from './dashboard-import-response';
export type { DashboardMetadataUpdateRequest } from './dashboard-metadata-update-request';
export type { DashboardResyncResponse } from './dashboard-resync-response';
export type { DashboardStatus } from './dashboard-status';
export type { DashboardSummaryResponse } from './dashboard-summary-response';
export type { PagedResponse } from './paged-response';
export type { WidgetInstanceResponse } from './widget-instance-response';
export type { AddWidgetRequest, UpdateWidgetRequest } from './widget-requests';

// API request params / options (framework-agnostic, used by api/ layer)
export type { DashboardListParams, DashboardsRequestOptions } from './dashboard-api-params';
export type {
  WidgetRenderBody,
  WidgetRenderContextPayload,
  WidgetRenderKind,
} from './dashboard-api-params';

// Bridge: persistence ↔ definition
export {
  STRUCTURAL_WIDGET_FIELDS,
  dashboardDetailToDefinition,
  diffDashboardWidgets,
  extractSlugFromTitleKey,
  widgetDefinitionToAddRequest,
  widgetDefinitionToUpdateRequest,
  widgetInstanceToDefinition,
} from './widget-bridge';
export type { DashboardWidgetDiff } from './widget-bridge';

// Drift detection (ADR-038)
export { detectVersionDrift } from './detect-version-drift';
export type { DashboardVersionDrift } from './detect-version-drift';
