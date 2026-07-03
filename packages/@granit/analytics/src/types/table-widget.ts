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
  /**
   * Column to order the rows by — a sortable field name (matches
   * `QueryMetadata.sortableFields[].name` / `TableWidgetColumn.name`). Null (or
   * absent) falls back to the query's default sort. Applied server-side before
   * the `pageSize` truncation, so it genuinely picks the "top N".
   */
  readonly sortField?: string | null;
  /**
   * Direction for {@link sortField}. Ignored when no sort field is set. Defaults
   * to `'asc'`. Mirrors `TableWidgetDefinition.SortDirection`.
   */
  readonly sortDirection?: 'asc' | 'desc';
}
