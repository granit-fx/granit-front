import type { WidgetSize } from './widget-size.js';

/**
 * Position of a widget on the dashboard grid.
 *
 * Coordinates are 0-based, top-left origin. A widget at `{ x: 0, y: 0, width: 6, height: 2 }`
 * spans the leftmost 6 columns and the top 2 rows.
 */
export interface DashboardWidgetPosition extends WidgetSize {
  readonly x: number;
  readonly y: number;
}

/**
 * One item in a dashboard's layout — references a widget by id and tells the
 * renderer where to place it. Decoupling layout from widget definition makes
 * it possible to share a single widget across multiple dashboards or to swap
 * layouts (compact / detailed) without touching widget content.
 */
export interface DashboardLayoutItem {
  /** Matches a {@link WidgetDefinition.id} in the dashboard's `widgets` collection. */
  readonly widgetId: string;
  readonly position: DashboardWidgetPosition;
}

/**
 * The grid layout of a dashboard.
 *
 * `columns` defaults to 12 — same convention as Bootstrap and react-grid-layout —
 * and is the basis for responsive recomputation when the viewport narrows.
 * `rowHeight` is hinted in pixels so the host can convert grid rows to a CSS
 * dimension; the renderer falls back to a sensible default when omitted.
 */
export interface DashboardLayout {
  /** Number of columns in the grid. Defaults to 12 when serialized without it. */
  readonly columns: number;
  /** Hint for the renderer — pixel height of one grid row. */
  readonly rowHeight?: number;
  /** Placements. The order has no semantic meaning; positions own placement. */
  readonly items: readonly DashboardLayoutItem[];
}
