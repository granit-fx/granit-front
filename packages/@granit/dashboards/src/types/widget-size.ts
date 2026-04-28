/**
 * Width / height of a widget on the dashboard grid, expressed in grid cells.
 * The grid is conventionally 12 columns wide; widget heights are typically
 * 1–6 rows. Mirrors `Granit.Dashboards.Abstractions.WidgetSize`.
 */
export interface WidgetSize {
  /** Grid columns occupied by the widget. Must be > 0. */
  readonly width: number;
  /** Grid rows occupied by the widget. Must be > 0. */
  readonly height: number;
}

/**
 * Conventional sizes mirroring the static factories on `WidgetSize`. Use
 * these for parity with backend-shipped definitions (`WidgetSize.SmallKpi` ↔
 * `WIDGET_SIZE.SMALL_KPI`); custom sizes are fine via plain object literals.
 */
export const WIDGET_SIZE = Object.freeze({
  /** A small KPI card — 3×1 (a quarter row). */
  SMALL_KPI: { width: 3, height: 1 } satisfies WidgetSize,
  /** A standard chart — half a row, two rows tall (6×2). */
  STANDARD_CHART: { width: 6, height: 2 } satisfies WidgetSize,
  /** A full-width content widget (12×1) — typical for markdown banners. */
  FULL_WIDTH_ROW: { width: 12, height: 1 } satisfies WidgetSize,
  /** A square media tile (4×4) — typical default for image / video widgets. */
  MEDIA_TILE: { width: 4, height: 4 } satisfies WidgetSize,
});
