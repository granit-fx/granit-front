import { resolveWidgetCoordinates } from '@granit/dashboards';

import { resolveWidgetMinSize, type WidgetCatalogEntry } from './widget-catalog';

import type { DashboardDefinition, WidgetDefinition } from '@granit/dashboards';
import type { Layout, LayoutItem } from 'react-grid-layout';

/**
 * Hard cap on widget height in grid rows — mirrors the resize clamp the
 * legacy gesture enforced. A 12-row tile is ~960px at the default 80px row
 * height, plenty for any single widget, and stops a runaway resize from
 * making a cell taller than the viewport.
 */
export const MAX_HEIGHT_ROWS = 12;

/**
 * Projects a dashboard's widgets into the `react-grid-layout` item array.
 *
 * Coordinates come from {@link resolveWidgetCoordinates}: explicit `x` / `y`
 * are honoured, the rest are first-fit-packed around them — so hand-authored
 * definitions (and fixtures predating the coordinate fields) still produce a
 * valid, non-overlapping layout. Per-kind minimum sizes come from the catalog;
 * height is capped at {@link MAX_HEIGHT_ROWS}.
 *
 * `i` is the widget `slug` — the stable identity `react-grid-layout` matches
 * against on drag / resize, consistent with the editor's reorder contract.
 */
export function toGridLayout(
  widgets: readonly WidgetDefinition[],
  columns: number,
  catalog?: readonly WidgetCatalogEntry[]
): LayoutItem[] {
  const coords = resolveWidgetCoordinates(widgets, columns);
  return widgets.map((widget, index) => {
    const min = resolveWidgetMinSize(catalog, widget.type);
    return {
      i: widget.slug,
      x: coords[index]?.x ?? 0,
      y: coords[index]?.y ?? 0,
      w: widget.size.width,
      h: widget.size.height,
      minW: min.width,
      minH: min.height,
      maxH: MAX_HEIGHT_ROWS,
    };
  });
}

/**
 * Folds a `react-grid-layout` layout back into a {@link DashboardDefinition}.
 *
 * Widgets are matched by `slug`, their `x` / `y` / `size` updated from the
 * layout, and `position` re-derived from the visual order (top-to-bottom,
 * then left-to-right) so the legacy dense-rank stays consistent with the
 * coordinate layout for a save round-trip.
 *
 * Returns the **same** definition reference when nothing changed, letting
 * callers skip a no-op `onChange` (react-grid-layout fires `onLayoutChange`
 * on mount and on every width reflow).
 */
export function fromGridLayout(
  layout: Layout,
  definition: DashboardDefinition
): DashboardDefinition {
  const bySlug = new Map(definition.widgets.map((widget) => [widget.slug, widget]));
  const ordered = [...layout].sort((a, b) => a.y - b.y || a.x - b.x);

  let changed = false;
  const widgets: WidgetDefinition[] = [];
  for (const [index, item] of ordered.entries()) {
    const widget = bySlug.get(item.i);
    if (!widget) continue;
    if (
      widget.position !== index ||
      widget.x !== item.x ||
      widget.y !== item.y ||
      widget.size.width !== item.w ||
      widget.size.height !== item.h
    ) {
      changed = true;
    }
    widgets.push({
      ...widget,
      position: index,
      x: item.x,
      y: item.y,
      size: { width: item.w, height: item.h },
    });
  }

  if (!changed && widgets.length === definition.widgets.length) return definition;
  return { ...definition, widgets };
}
