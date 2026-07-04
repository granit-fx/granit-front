// ---------------------------------------------------------------------------
// @granit/analytics — DTO contracts (framework-agnostic, hand-curated to mirror
// the Granit.Analytics OpenAPI surface). Runtime helpers (type guards) live in
// ../widgets; the metric-evaluation client lives in ../api.
// ---------------------------------------------------------------------------

// Metrics — runtime evaluation envelopes
export type {
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
} from './metric';

// Widgets — catalog declarations
export type { AggregateFunction } from './aggregation';
export type { AnalyticsWidgetDefinition } from './analytics-widget';
export type {
  ChartComboSeries,
  ChartType,
  ChartWidgetDefinition,
  ComboRenderAs,
} from './chart-widget';
export type { KpiWidgetDefinition } from './kpi-widget';
export type {
  AddressMapPointSource,
  GeographyMapPointSource,
  LatLngMapPointSource,
  MapCenter,
  MapPointSource,
  MapTileLayerKind,
  MapWidgetDefinition,
} from './map-widget';
export type { PivotWidgetDefinition } from './pivot-widget';
export type { TableWidgetDefinition } from './table-widget';

// Widgets — snapshot envelopes consumed by @granit/dashboards
export type {
  ChartBucket,
  ChartComboSeriesSnapshot,
  ChartSnapshotEnvelope,
  ChartWidgetSnapshot,
  ScatterPoint,
} from './chart-snapshot';
export type { KpiSnapshot, KpiSnapshotEnvelope } from './kpi-snapshot';
export type {
  MapCenterPayload,
  MapPoint,
  MapSnapshotEnvelope,
  MapWidgetSnapshot,
} from './map-snapshot';
export type { PivotCell, PivotSnapshotEnvelope, PivotWidgetSnapshot } from './pivot-snapshot';
export type {
  TableSnapshotEnvelope,
  TableWidgetColumn,
  TableWidgetSnapshot,
} from './table-snapshot';
