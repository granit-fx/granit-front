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
  TelemetryAggregation,
  TelemetryDatasource,
  TextWidgetDefinition,
  TextWidgetStyle,
  TimeWindowKind,
  WidgetDefinition,
  WidgetDefinitionBase,
  WidgetSize,
} from './types/index.js';
