// ---------------------------------------------------------------------------
// @granit/analytics — public API (framework-agnostic)
// ---------------------------------------------------------------------------

// API — runtime metric evaluation
export { evaluateMetric } from './api/metrics-api.js';

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
  isGeographyMapPointSource,
  isKpiSnapshotEnvelope,
  isLatLngMapPointSource,
  isMapSnapshotEnvelope,
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
  GeographyMapPointSource,
  KpiSnapshot,
  KpiSnapshotEnvelope,
  KpiWidgetDefinition,
  LatLngMapPointSource,
  MapCenter,
  MapCenterPayload,
  MapPoint,
  MapPointSource,
  MapSnapshotEnvelope,
  MapTileLayerKind,
  MapWidgetDefinition,
  MapWidgetSnapshot,
  PivotCell,
  PivotSnapshotEnvelope,
  PivotWidgetDefinition,
  PivotWidgetSnapshot,
  TableSnapshotEnvelope,
  TableWidgetColumn,
  TableWidgetDefinition,
  TableWidgetSnapshot,
} from './widgets/index.js';
