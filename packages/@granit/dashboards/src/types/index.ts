export type { AggregateFunction } from './aggregate-function.js';
export type { RefreshHint } from './refresh-hint.js';
export type { ResolvedPeriod } from './resolved-period.js';
export type { DataKeyFormat } from './data-key-format.js';
export type { DashboardCategory } from './dashboard-category.js';
export { DASHBOARD_TIME_WINDOW } from './dashboard-time-window.js';
export {
  Datasource,
  isMetricDatasource,
  isQueryAggregateDatasource,
  isTelemetryDatasource,
} from './datasource.js';
export type {
  MetricDatasource,
  QueryAggregateDatasource,
  TelemetryAggregation,
  TelemetryDatasource,
} from './datasource.js';
export type {
  DashboardPeriod,
  DashboardTimeWindow,
  TimeWindowKind,
} from './dashboard-time-window.js';
export type {
  DashboardDefinitionDescriptor,
  DashboardDefinitionRegistry,
} from './dashboard-definition-descriptor.js';
export type { DashboardDefinition } from './dashboard-definition.js';
export { DEFAULT_DASHBOARD_LAYOUT } from './dashboard-layout.js';
export type {
  DashboardBreakpoint,
  DashboardLayout,
  DashboardLayoutOverride,
} from './dashboard-layout.js';
export type {
  DashboardFilter,
  DashboardFilterClause,
  DashboardFilterOperation,
  DashboardFilterOperator,
} from './dashboard-filter.js';
export type { DashboardView } from './dashboard-view.js';
export {
  isRouteParamResolver,
  isStaticEntityResolver,
  isTenantContextResolver,
  isUserSelectionResolver,
  isViewEntityResolver,
} from './entity-alias.js';
export type {
  EntityAlias,
  EntityAliasResolver,
  RouteParamResolver,
  StaticEntityResolver,
  TenantContextResolver,
  UserSelectionResolver,
  ViewEntityResolver,
} from './entity-alias.js';
export { formatDurationFromMs, parseDurationToMs } from './parse-duration.js';
export type { WidgetAction, WidgetActionKind, WidgetActionTrigger } from './widget-action.js';
export type {
  FrameworkWidgetDefinition,
  ImageFit,
  ImageWidgetDefinition,
  MarkdownWidgetDefinition,
  TextWidgetDefinition,
  TextWidgetStyle,
  WidgetDefinition,
  WidgetDefinitionBase,
} from './widget-definition.js';
export { WIDGET_SIZE } from './widget-size.js';
export type { WidgetSize } from './widget-size.js';

// ---------------------------------------------------------------------------
// Lifecycle / persistence DTOs (B4-write — Granit.Dashboards.Endpoints).
// Distinct from `./rendering/` shapes for the render pipeline.
// ---------------------------------------------------------------------------

export type { DashboardCatalogEntryResponse } from './dashboard-catalog-entry-response.js';
export type { DashboardDetailResponse } from './dashboard-detail-response.js';
export type { DashboardImportResponse } from './dashboard-import-response.js';
export type { DashboardMetadataUpdateRequest } from './dashboard-metadata-update-request.js';
export type { DashboardResyncResponse } from './dashboard-resync-response.js';
export type { DashboardStatus } from './dashboard-status.js';
export type { DashboardSummaryResponse } from './dashboard-summary-response.js';
export type { PagedResponse } from './paged-response.js';
export type { WidgetInstanceResponse } from './widget-instance-response.js';
export type { AddWidgetRequest, UpdateWidgetRequest } from './widget-requests.js';

// Bridge: persistence ↔ definition
export {
  STRUCTURAL_WIDGET_FIELDS,
  dashboardDetailToDefinition,
  diffDashboardWidgets,
  extractSlugFromTitleKey,
  widgetDefinitionToAddRequest,
  widgetDefinitionToUpdateRequest,
  widgetInstanceToDefinition,
} from './widget-bridge.js';
export type { DashboardWidgetDiff } from './widget-bridge.js';

// Drift detection (ADR-038)
export { detectVersionDrift } from './detect-version-drift.js';
export type { DashboardVersionDrift } from './detect-version-drift.js';
