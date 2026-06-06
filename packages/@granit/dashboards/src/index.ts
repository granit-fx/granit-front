// ---------------------------------------------------------------------------
// @granit/dashboards — public API (framework-agnostic)
// ---------------------------------------------------------------------------

export {
  DASHBOARD_TIME_WINDOW,
  Datasource,
  DEFAULT_DASHBOARD_LAYOUT,
  formatDurationFromMs,
  isMetricDatasource,
  isQueryAggregateDatasource,
  isRouteParamResolver,
  isStaticEntityResolver,
  isTelemetryDatasource,
  isTenantContextResolver,
  isUserSelectionResolver,
  isViewEntityResolver,
  parseDurationToMs,
  WIDGET_SIZE,
} from './types/index';
export type {
  AggregateFunction,
  DashboardBreakpoint,
  DashboardCategory,
  DashboardDefinition,
  DashboardDefinitionDescriptor,
  DashboardDefinitionRegistry,
  DashboardFilter,
  DashboardFilterClause,
  DashboardFilterOperation,
  DashboardFilterOperator,
  DashboardLayout,
  DashboardLayoutOverride,
  DashboardPeriod,
  DashboardTimeWindow,
  DashboardView,
  DataKeyFormat,
  EntityAlias,
  EntityAliasResolver,
  FrameworkWidgetDefinition,
  ImageFit,
  ImageWidgetDefinition,
  MarkdownWidgetDefinition,
  MetricDatasource,
  QueryAggregateDatasource,
  RefreshHint,
  ResolvedPeriod,
  RouteParamResolver,
  StaticEntityResolver,
  TelemetryAggregation,
  TelemetryDatasource,
  TenantContextResolver,
  TextWidgetDefinition,
  TextWidgetStyle,
  TimeWindowKind,
  UserSelectionResolver,
  ViewEntityResolver,
  WidgetAction,
  WidgetActionKind,
  WidgetActionTrigger,
  WidgetDefinition,
  WidgetDefinitionBase,
  WidgetSize,
} from './types/index';

// Lifecycle / persistence DTOs (B4-write — Granit.Dashboards.Endpoints)
export type {
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
  WidgetInstanceResponse,
} from './types/index';

// Bridge between persistence (`WidgetInstanceResponse`) and declarative
// (`WidgetDefinition`) views — used by editor surfaces saving back through
// the per-widget CRUD endpoints.
export {
  STRUCTURAL_WIDGET_FIELDS,
  dashboardDetailToDefinition,
  diffDashboardWidgets,
  extractSlugFromTitleKey,
  widgetDefinitionToAddRequest,
  widgetDefinitionToUpdateRequest,
  widgetInstanceToDefinition,
} from './types/index';
export type { DashboardWidgetDiff } from './types/index';

// Drift detection (ADR-038) — semver comparison between persisted
// instances and their source-definition catalog entry.
export { detectVersionDrift } from './types/index';
export type { DashboardVersionDrift } from './types/index';

// Rendering — wire contracts for the dashboard render pipeline plus per-kind
// snapshots (B3-1 / B3-2 / B3-3, ADR-039).
export {
  isImageSnapshotEnvelope,
  isMarkdownSnapshotEnvelope,
  isTextSnapshotEnvelope,
} from './rendering/index';
// HTTP API — Axios-based, framework-agnostic. React Query hooks live in
// @granit/react-dashboards and delegate to these functions.
export {
  archiveDashboard,
  createWidget,
  deleteWidget,
  getDashboard,
  getDashboardCatalog,
  importDashboard,
  listDashboards,
  publishDashboard,
  renderDashboard,
  renderWidget,
  restoreDashboard,
  resyncDashboard,
  updateDashboardMetadata,
  updateWidget,
} from './api/index';
export type {
  DashboardCatalogParams,
  DashboardListParams,
  DashboardsRequestOptions,
  WidgetRenderBody,
  WidgetRenderContextPayload,
  WidgetRenderKind,
} from './types/index';

export type {
  DashboardDriftStatus,
  DashboardRenderedWidget,
  DashboardRenderPeriod,
  DashboardRenderRequest,
  DashboardRenderResponse,
  ImageSnapshotEnvelope,
  ImageWidgetSnapshot,
  MarkdownSnapshotEnvelope,
  MarkdownWidgetSnapshot,
  TextSnapshotEnvelope,
  TextWidgetSnapshot,
  WidgetSnapshotEnvelope,
  WidgetSnapshotEnvelopeOf,
  WidgetSnapshotStatus,
  WidgetTransport,
} from './rendering/index';
