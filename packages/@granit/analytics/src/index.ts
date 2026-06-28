// ---------------------------------------------------------------------------
// @granit/analytics — public API (framework-agnostic)
// ---------------------------------------------------------------------------

// API — runtime metric evaluation
export { evaluateMetric } from './api/metrics-api';

// DTO contracts
export type {
  // Metrics — runtime evaluation envelopes
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
  // Widgets — catalog declarations + snapshot envelopes consumed by @granit/dashboards
  AddressMapPointSource,
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
} from './types';

// Widgets — runtime type guards
export {
  isAddressMapPointSource,
  isChartSnapshotEnvelope,
  isGeographyMapPointSource,
  isKpiSnapshotEnvelope,
  isLatLngMapPointSource,
  isMapSnapshotEnvelope,
  isPivotSnapshotEnvelope,
  isTableSnapshotEnvelope,
} from './widgets';
