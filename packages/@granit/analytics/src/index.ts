// ---------------------------------------------------------------------------
// @granit/analytics — public API (framework-agnostic)
// ---------------------------------------------------------------------------

// API — runtime metric evaluation + catalogue
export { evaluateMetric, listMetricCatalog } from './api/metrics-api';

// DTO contracts
export type {
  // Metrics — runtime evaluation envelopes
  CompareSpec,
  CompareToken,
  MetricCatalogEntryResponse,
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
  ChartComboSeries,
  ChartComboSeriesSnapshot,
  ChartSnapshotEnvelope,
  ChartType,
  ChartWidgetDefinition,
  ChartWidgetSnapshot,
  ComboRenderAs,
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
  ScatterPoint,
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
