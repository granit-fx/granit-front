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

// Widgets — catalog declarations consumed by @granit/dashboards
export { isKpiSnapshotEnvelope } from './widgets/index.js';
export type {
  AggregateFunction,
  AnalyticsWidgetDefinition,
  ChartType,
  ChartWidgetDefinition,
  KpiSnapshot,
  KpiSnapshotEnvelope,
  KpiWidgetDefinition,
  PivotWidgetDefinition,
  TableWidgetDefinition,
} from './widgets/index.js';
