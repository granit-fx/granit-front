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
