import type { AggregateFunction } from './aggregation.js';
import type { WidgetDefinitionBase } from '@granit/dashboards';

/**
 * Visual hint for chart widgets, interpreted by the frontend renderer.
 * Mirrors `Granit.Analytics.Dashboards.Widgets.ChartType`. PascalCase wire
 * values — the framework's host registers a `JsonStringEnumConverter()`
 * with no naming policy. Order matches the backend numeric declaration.
 */
export type ChartType = 'Bar' | 'HorizontalBar' | 'Line' | 'Area' | 'Pie' | 'Donut';

/**
 * Aggregated chart bound to a `QueryDefinition`. Mirrors
 * `Granit.Analytics.Dashboards.Widgets.ChartWidgetDefinition`.
 *
 * Unlike a KPI, a chart owns its aggregation (sum / average / count over a
 * chosen field) so the same query can power multiple distinct charts.
 */
export interface ChartWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'chart';
  /** The `QueryDefinition.Name` backing this chart. */
  readonly queryName: string;
  /** Field used as the chart's category axis (e.g. `IssuedAtMonth`). */
  readonly groupBy: string;
  readonly aggregation: AggregateFunction;
  /** Field aggregated. Null when `aggregation === 'Count'`. */
  readonly field: string | null;
  readonly chartType: ChartType;
}
