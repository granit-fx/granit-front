export type { AggregateFunction } from './aggregation.js';
export { isChartSnapshotEnvelope } from './chart-snapshot.js';
export type { ChartBucket, ChartSnapshotEnvelope, ChartWidgetSnapshot } from './chart-snapshot.js';
export type { ChartType, ChartWidgetDefinition } from './chart-widget.js';
export { isKpiSnapshotEnvelope } from './kpi-snapshot.js';
export type { KpiSnapshot, KpiSnapshotEnvelope } from './kpi-snapshot.js';
export type { KpiWidgetDefinition } from './kpi-widget.js';
export { isPivotSnapshotEnvelope } from './pivot-snapshot.js';
export type { PivotCell, PivotSnapshotEnvelope, PivotWidgetSnapshot } from './pivot-snapshot.js';
export type { PivotWidgetDefinition } from './pivot-widget.js';
export { isTableSnapshotEnvelope } from './table-snapshot.js';
export type {
  TableSnapshotEnvelope,
  TableWidgetColumn,
  TableWidgetSnapshot,
} from './table-snapshot.js';
export type { TableWidgetDefinition } from './table-widget.js';

import type { ChartWidgetDefinition } from './chart-widget.js';
import type { KpiWidgetDefinition } from './kpi-widget.js';
import type { PivotWidgetDefinition } from './pivot-widget.js';
import type { TableWidgetDefinition } from './table-widget.js';

/**
 * Closed union of every analytics widget shipped by `Granit.Analytics`. Used
 * by the frontend dispatcher to refine `WidgetDefinition` to a known analytics
 * variant when registering renderers.
 */
export type AnalyticsWidgetDefinition =
  | KpiWidgetDefinition
  | ChartWidgetDefinition
  | TableWidgetDefinition
  | PivotWidgetDefinition;
