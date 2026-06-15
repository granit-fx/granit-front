import type { WidgetDefinitionBase } from '@granit/dashboards';

/**
 * Tabular widget bound to a `QueryDefinition`. Mirrors
 * `Granit.Analytics.Dashboards.Widgets.TableWidgetDefinition`.
 *
 * Renders a paginated grid of rows using the query's filter / sort surface.
 */
export interface TableWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'table';
  /** The `QueryDefinition.Name` backing this table. */
  readonly queryName: string;
  /** Subset of the query's columns to surface, in order. Null = render all. */
  readonly visibleColumns: readonly string[] | null;
  readonly pageSize: number;
}
