import type { WidgetDefinitionBase } from './widget-definition';
import type { WidgetSize } from './widget-size';

/**
 * A widget's top-left cell on the dashboard grid. Coordinate layout
 * (Grafana-style) — the authoritative placement once a dashboard is edited,
 * superseding the legacy dense-ranked `position`.
 */
export interface GridCoordinate {
  readonly x: number;
  readonly y: number;
}

interface Occupiable {
  readonly size: WidgetSize;
}

/**
 * A `columns`-wide occupancy grid exposing the shared placement primitives:
 * `occupy` reserves a `w × h` box, and `place` first-fit-scans row by row for
 * the first free cell that fits a `w × h` box, reserves it, and returns it.
 * Both {@link packWidgetCoordinates} and {@link resolveWidgetCoordinates} drive
 * this so their packing stays identical.
 */
function createOccupancyGrid(cols: number): {
  occupy: (x: number, y: number, w: number, h: number) => void;
  place: (w: number, h: number) => GridCoordinate;
} {
  const occupied = new Set<string>();
  const occupy = (x: number, y: number, w: number, h: number): void => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) occupied.add(`${x + dx},${y + dy}`);
    }
  };
  const fits = (x: number, y: number, w: number, h: number): boolean => {
    if (x + w > cols) return false;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (occupied.has(`${x + dx},${y + dy}`)) return false;
      }
    }
    return true;
  };
  const place = (w: number, h: number): GridCoordinate => {
    for (let y = 0; ; y++) {
      for (let x = 0; x + w <= cols; x++) {
        if (fits(x, y, w, h)) {
          occupy(x, y, w, h);
          return { x, y };
        }
      }
    }
  };
  return { occupy, place };
}

/**
 * First-fit dense packer: walks `widgets` in the given order and drops each at
 * the first free `(x, y)` cell on a `columns`-wide grid, scanning row by row.
 * Mirrors the backend's coordinate backfill so a dashboard whose definition
 * predates the `x` / `y` fields packs identically on both sides.
 *
 * Widths wider than the grid are clamped to `columns`. Returns one coordinate
 * per input widget, index-aligned.
 */
export function packWidgetCoordinates(
  widgets: readonly Occupiable[],
  columns: number
): readonly GridCoordinate[] {
  const cols = Math.max(1, columns);
  const grid = createOccupancyGrid(cols);
  return widgets.map(({ size }) =>
    grid.place(Math.min(Math.max(1, size.width), cols), Math.max(1, size.height))
  );
}

/**
 * Resolves a grid coordinate for every widget: honours explicit `x` / `y` when
 * a widget carries both, and first-fit-packs the rest around the explicitly
 * placed ones (so a mix of authored and unplaced widgets never overlaps).
 *
 * Use this to normalise a {@link WidgetDefinitionBase} list — e.g. hand-authored
 * catalog dashboards or fixtures that predate the coordinate fields — into a
 * fully-placed layout the editor and renderer can drive.
 */
export function resolveWidgetCoordinates(
  widgets: readonly WidgetDefinitionBase[],
  columns: number
): readonly GridCoordinate[] {
  const cols = Math.max(1, columns);
  const grid = createOccupancyGrid(cols);

  // Pass 1 — reserve the cells of every explicitly-placed widget.
  for (const widget of widgets) {
    if (widget.x !== undefined && widget.y !== undefined) {
      const w = Math.min(Math.max(1, widget.size.width), cols);
      grid.occupy(widget.x, widget.y, w, Math.max(1, widget.size.height));
    }
  }

  // Pass 2 — keep explicit coords, first-fit the rest around them.
  return widgets.map((widget) => {
    if (widget.x !== undefined && widget.y !== undefined) {
      return { x: widget.x, y: widget.y };
    }
    return grid.place(
      Math.min(Math.max(1, widget.size.width), cols),
      Math.max(1, widget.size.height)
    );
  });
}
