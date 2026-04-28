import type { WidgetDefinitionBase } from '@granit/dashboards';

/**
 * Single-value KPI tile bound to a `MetricDefinition`. Mirrors
 * `Granit.Analytics.Dashboards.Widgets.KpiWidgetDefinition`.
 *
 * The widget renders the metric's current value plus an optional comparison
 * delta with favorable / unfavorable color (driven by
 * `MetricSnapshotPayload.previous.isFavorable`).
 */
export interface KpiWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'kpi';
  /** The `MetricDefinition.Name` this KPI surfaces (e.g. `Granit.Invoicing.UnpaidInvoiceCountMetric`). */
  readonly metricName: string;
}
