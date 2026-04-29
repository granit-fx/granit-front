// ---------------------------------------------------------------------------
// @granit/analytics — public API (framework-agnostic)
// ---------------------------------------------------------------------------

// Metrics — runtime evaluation envelopes
export type {
  CompareSpec,
  CompareToken,
  MetricPreviousPayload,
  MetricRequest,
  MetricResponse,
  MetricSnapshotPayload,
  PeriodSpec,
  PeriodToken,
  RefreshHint,
  Trend,
  ValueKind,
} from './metrics/index.js';

// Widgets — catalog declarations + snapshot envelopes consumed by @granit/dashboards
export {
  isChartSnapshotEnvelope,
  isKpiSnapshotEnvelope,
  isPivotSnapshotEnvelope,
  isTableSnapshotEnvelope,
} from './widgets/index.js';
export type {
  AggregateFunction,
  AnalyticsWidgetDefinition,
  ChartBucket,
  ChartSnapshotEnvelope,
  ChartType,
  ChartWidgetDefinition,
  ChartWidgetSnapshot,
  KpiSnapshot,
  KpiSnapshotEnvelope,
  KpiWidgetDefinition,
  PivotCell,
  PivotSnapshotEnvelope,
  PivotWidgetDefinition,
  PivotWidgetSnapshot,
  TableSnapshotEnvelope,
  TableWidgetColumn,
  TableWidgetDefinition,
  TableWidgetSnapshot,
} from './widgets/index.js';
