import type { AggregateFunction } from './aggregation.js';
import type { WidgetDefinitionBase } from '@granit/dashboards';

/**
 * Pivot-table widget — rows × columns × value cells. Classic OLAP shape.
 * Mirrors `Granit.Analytics.Dashboards.Widgets.PivotWidgetDefinition`.
 */
export interface PivotWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'pivot';
  /** The `QueryDefinition.Name` backing this pivot. */
  readonly queryName: string;
  /** Fields used as row dimensions (in order). */
  readonly rowFields: readonly string[];
  /** Fields used as column dimensions (in order). */
  readonly columnFields: readonly string[];
  /** Field aggregated in each cell. Null when `valueAggregation === 'Count'`. */
  readonly valueField: string | null;
  readonly valueAggregation: AggregateFunction;
}
