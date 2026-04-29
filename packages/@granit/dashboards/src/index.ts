// ---------------------------------------------------------------------------
// @granit/dashboards — public API (framework-agnostic)
// ---------------------------------------------------------------------------

export {
  DASHBOARD_TIME_WINDOW,
  Datasource,
  DEFAULT_DASHBOARD_LAYOUT,
  isMetricDatasource,
  isQueryAggregateDatasource,
  isTelemetryDatasource,
  WIDGET_SIZE,
} from './types/index.js';
export type {
  AggregateFunction,
  DashboardCategory,
  DashboardDefinition,
  DashboardDefinitionDescriptor,
  DashboardDefinitionRegistry,
  DashboardLayout,
  DashboardPeriod,
  DashboardTimeWindow,
  DataKeyFormat,
  FrameworkWidgetDefinition,
  ImageWidgetDefinition,
  MarkdownWidgetDefinition,
  MetricDatasource,
  QueryAggregateDatasource,
  RefreshHint,
  ResolvedPeriod,
  TelemetryAggregation,
  TelemetryDatasource,
  TextWidgetDefinition,
  TextWidgetStyle,
  TimeWindowKind,
  WidgetAction,
  WidgetActionKind,
  WidgetActionTrigger,
  WidgetDefinition,
  WidgetDefinitionBase,
  WidgetSize,
} from './types/index.js';

// Rendering — wire contracts for the dashboard render pipeline (B3-1, ADR-039).
export type {
  WidgetSnapshotEnvelope,
  WidgetSnapshotEnvelopeOf,
  WidgetSnapshotStatus,
} from './rendering/index.js';
