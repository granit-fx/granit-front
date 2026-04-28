/**
 * Logical size of a widget in dashboard grid units.
 *
 * The grid is column-and-row based — `width: 6` means "span 6 columns of the
 * dashboard layout grid". The dashboard layout owns the column count (default 12);
 * widgets are resized by adjusting these spans, never by pixel dimensions.
 */
export interface WidgetSize {
  /** Number of grid columns the widget spans. Must be ≥ 1 and ≤ layout.columns. */
  readonly width: number;
  /** Number of grid rows the widget spans. Must be ≥ 1. */
  readonly height: number;
}
