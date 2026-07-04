import type { AggregateFunction } from './aggregation';
import type { WidgetDefinitionBase } from '@granit/dashboards';

/**
 * Visual hint for chart widgets, interpreted by the frontend renderer.
 * Mirrors `Granit.Analytics.Dashboards.Widgets.ChartType`. PascalCase wire
 * values — the framework's host registers a `JsonStringEnumConverter()`
 * with no naming policy. Order matches the backend numeric declaration.
 */
export type ChartType =
  | 'Bar'
  | 'HorizontalBar'
  | 'Line'
  | 'Area'
  | 'Pie'
  | 'Donut'
  | 'Radar'
  | 'Funnel'
  | 'Treemap'
  | 'Heatmap';

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
  /**
   * Optional second categorical dimension. When set, the chart becomes
   * multi-series — one series per distinct `seriesBy` value (grouped/stacked
   * bars, multi-line, stacked area, heatmap). Absent/`null` for a single-series
   * chart. `Heatmap` requires it; the pie family / radar / funnel / treemap
   * ignore it.
   */
  readonly seriesBy?: string | null;
  /**
   * Stack the series instead of grouping them side-by-side. Only meaningful for
   * `Bar` / `HorizontalBar` / `Line` / `Area` with a `seriesBy` set; the backend
   * zeroes it out for every other chart type.
   */
  readonly stacked?: boolean;
}
