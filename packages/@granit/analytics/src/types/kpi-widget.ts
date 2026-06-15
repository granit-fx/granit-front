import type { Datasource, WidgetDefinitionBase } from '@granit/dashboards';

/**
 * Single-value KPI tile. Mirrors
 * `Granit.Analytics.Dashboards.Widgets.KpiWidgetDefinition` (P2.2).
 *
 * Renders the tile's value, an optional comparison delta and a
 * favorable / unfavorable color cue. The cue is driven by
 * `MetricDefinition.IsHigherBetter` when bound via {@link MetricDatasource};
 * other datasource kinds render the value as-is.
 *
 * Datasource binding (P2.2) decouples the widget from how its data arrives:
 *
 * - {@link MetricDatasource} — analytics dashboards (the common case)
 * - {@link QueryAggregateDatasource} — ad-hoc admin pages reusing the same widget
 * - {@link TelemetryDatasource} — IoT gauges
 */
export interface KpiWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'kpi';
  /**
   * Data binding for the KPI value. Use the `Datasource.metric(...)` /
   * `Datasource.queryAggregate(...)` / `Datasource.telemetry(...)` factories
   * for compact call sites.
   */
  readonly datasource: Datasource;
}
