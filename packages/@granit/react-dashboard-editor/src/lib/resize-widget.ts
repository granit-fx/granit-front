import type { DashboardDefinition, WidgetSize } from '@granit/dashboards';

/**
 * Hard cap on widget height in grid rows. The framework grid is 12
 * columns wide by convention; height has no protocol-level limit but
 * 12 rows is plenty for any single tile (a full-screen 12×12 widget
 * is ~960px at the default 80px row height) and the cap prevents
 * runaway gestures from making a cell taller than the viewport.
 */
const MAX_HEIGHT_ROWS = 12;

/**
 * Clamps a value into `[min, max]` (inclusive).
 */
function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Returns a fresh `DashboardDefinition` with the widget identified by
 * `slug` resized to `size`. Width is clamped to
 * `[1, definition.layout.columns]`; height is clamped to
 * `[1, MAX_HEIGHT_ROWS]`. Returns the original definition unchanged
 * when the slug is unknown or the clamped size is identical to the
 * widget's current size — lets callers diff cheaply with referential
 * equality.
 *
 * Pure function — pairs with `reorderWidgets` and `addWidget` /
 * `removeWidget` from the same `lib/` namespace.
 */
export function resizeWidget(
  definition: DashboardDefinition,
  slug: string,
  size: WidgetSize
): DashboardDefinition {
  const targetWidth = clamp(size.width, 1, definition.layout.columns);
  const targetHeight = clamp(size.height, 1, MAX_HEIGHT_ROWS);
  let mutated = false;
  const widgets = definition.widgets.map((widget) => {
    if (widget.slug !== slug) return widget;
    if (widget.size.width === targetWidth && widget.size.height === targetHeight) return widget;
    mutated = true;
    return { ...widget, size: { width: targetWidth, height: targetHeight } };
  });
  if (!mutated) return definition;
  return { ...definition, widgets };
}
