export type { AggregateFunction } from './aggregation';
export { isChartSnapshotEnvelope } from './chart-snapshot';
export type { ChartBucket, ChartSnapshotEnvelope, ChartWidgetSnapshot } from './chart-snapshot';
export type { ChartType, ChartWidgetDefinition } from './chart-widget';
export { isKpiSnapshotEnvelope } from './kpi-snapshot';
export type { KpiSnapshot, KpiSnapshotEnvelope } from './kpi-snapshot';
export type { KpiWidgetDefinition } from './kpi-widget';
export { isMapSnapshotEnvelope } from './map-snapshot';
export type {
  MapCenterPayload,
  MapPoint,
  MapSnapshotEnvelope,
  MapWidgetSnapshot,
} from './map-snapshot';
export { isGeographyMapPointSource, isLatLngMapPointSource } from './map-widget';
export type {
  GeographyMapPointSource,
  LatLngMapPointSource,
  MapCenter,
  MapPointSource,
  MapTileLayerKind,
  MapWidgetDefinition,
} from './map-widget';
export { isPivotSnapshotEnvelope } from './pivot-snapshot';
export type { PivotCell, PivotSnapshotEnvelope, PivotWidgetSnapshot } from './pivot-snapshot';
export type { PivotWidgetDefinition } from './pivot-widget';
export { isTableSnapshotEnvelope } from './table-snapshot';
export type {
  TableSnapshotEnvelope,
  TableWidgetColumn,
  TableWidgetSnapshot,
} from './table-snapshot';
export type { TableWidgetDefinition } from './table-widget';

import type { ChartWidgetDefinition } from './chart-widget';
import type { KpiWidgetDefinition } from './kpi-widget';
import type { MapWidgetDefinition } from './map-widget';
import type { PivotWidgetDefinition } from './pivot-widget';
import type { TableWidgetDefinition } from './table-widget';

/**
 * Closed union of every analytics widget shipped by `Granit.Analytics`. Used
 * by the frontend dispatcher to refine `WidgetDefinition` to a known analytics
 * variant when registering renderers.
 */
export type AnalyticsWidgetDefinition =
  | KpiWidgetDefinition
  | ChartWidgetDefinition
  | TableWidgetDefinition
  | PivotWidgetDefinition
  | MapWidgetDefinition;
