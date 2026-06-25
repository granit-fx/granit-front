import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  DashboardContextProvider,
  resolveEffectiveLayout,
  useDashboardBreakpoint,
  WidgetRenderer,
} from '@granit/react-dashboards';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { reorderWidgets } from '../lib/reorder-widgets';
import { resizeWidget } from '../lib/resize-widget';
import { resolveWidgetMinSize, type WidgetCatalogEntry } from '../lib/widget-catalog';

import { SortableWidgetCell } from './sortable-widget-cell';

import type { DashboardDefinition, WidgetDefinition, WidgetSize } from '@granit/dashboards';

const GRID_GAP_PX = 16;

/**
 * Editor-mode dashboard. Mirrors the read-mode `<Dashboard>` from
 * `@granit/react-dashboards` (auto-flow CSS grid, widgets fill cells in
 * `position` order, each spans its declared `size.width × size.height`),
 * with these editor extras:
 *
 * - **dnd-kit-driven reorder**: each cell is a sortable item keyed by its
 *   `slug`. A small drag handle on the top-left initiates the gesture; the
 *   widget body itself stays interactive (links, popovers, click actions).
 * - **Drag-resize**: a bottom-right corner handle resizes the cell on
 *   pointer drag, snapping to integer grid cells. Width clamped to
 *   `[1, layout.columns]`, height to `[1, 12]`.
 * - **`onChange` callback**: emits a fresh `DashboardDefinition` whose
 *   widgets carry recomputed `position` ranks (0-based, contiguous) — ready
 *   to round-trip through the backend's widget-CRUD endpoints without a
 *   normalisation pass.
 *
 * Apps drive saves via React Query mutations on the parent — the editor
 * stays presentational. The same widget registry the read-mode `<Dashboard>`
 * consumes drives the renderers here, so a kind that doesn't ship a
 * renderer surfaces the framework's "Unknown widget type" placeholder
 * (no special editor-side fallback).
 */
export interface EditableDashboardProps {
  readonly definition: DashboardDefinition;
  /**
   * Fires after a successful drag-end or drag-resize. Consumers update
   * local state + invalidate / persist via their own pipeline.
   */
  readonly onChange: (next: DashboardDefinition) => void;
  readonly className?: string;
  /** Override the row height (in pixels). Falls back to `definition.layout.rowHeight`. */
  readonly rowHeight?: number;
  /**
   * Widget catalog driving per-kind minimum sizes for the drag-resize
   * clamp. When omitted (or a widget's type is absent), the floor is
   * {@link DEFAULT_MIN_WIDGET_SIZE} (`1x1`) — the historical behaviour.
   * Pass the same composed catalog the palette uses so a KPI can't be
   * shrunk below the space its value needs, etc.
   */
  readonly catalog?: readonly WidgetCatalogEntry[];
}

export function EditableDashboard({
  definition,
  onChange,
  className,
  rowHeight,
  catalog,
}: EditableDashboardProps) {
  const breakpoint = useDashboardBreakpoint();

  const { layout, widgets: orderedWidgets } = useMemo(
    () => resolveEffectiveLayout(definition.layout, definition.widgets, breakpoint),
    [definition.layout, definition.widgets, breakpoint]
  );
  const sortableIds = useMemo(() => orderedWidgets.map((w) => w.slug), [orderedWidgets]);

  // PointerSensor with a small activation distance so click-on-handle
  // doesn't accidentally start a drag every time the user grabs the cell.
  // KeyboardSensor wires arrow-key reorder for keyboard-only operators.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const effectiveRowHeight = rowHeight ?? layout.rowHeight;

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridAutoFlow: 'dense',
    gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
    gridAutoRows: `${effectiveRowHeight}px`,
    gap: `${GRID_GAP_PX}px`,
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = reorderWidgets(definition, String(active.id), String(over.id));
    if (next !== definition) onChange(next);
  };

  // Live container width drives the column-px metric for resize gestures.
  // ResizeObserver fires on mount + whenever the parent reflows (sidebar
  // toggle, viewport resize, etc.) so the resize gesture stays accurate.
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [columnPx, setColumnPx] = useState(0);
  useEffect(() => {
    const element = gridRef.current;
    // ResizeObserver is unavailable in JSDOM and old SSR runtimes —
    // skip silently so the editor still renders (resize handle just
    // won't move; reorder + everything else still works).
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const totalWidth = entry.contentRect.width;
      const cellsTotalGap = (layout.columns - 1) * GRID_GAP_PX;
      setColumnPx((totalWidth - cellsTotalGap) / layout.columns);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [layout.columns]);

  const handleResize = (slug: string, size: WidgetSize, minSize: WidgetSize) => {
    const next = resizeWidget(definition, slug, size, minSize);
    if (next !== definition) onChange(next);
  };

  return (
    <DashboardContextProvider value={{ dashboardName: definition.name }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div
            ref={gridRef}
            data-slot="editable-dashboard"
            data-dashboard-name={definition.name}
            data-breakpoint={breakpoint}
            className={className}
            style={gridStyle}
          >
            {orderedWidgets.map((widget) => {
              const minSize = resolveWidgetMinSize(catalog, widget.type);
              return (
                <EditableCell
                  key={widget.slug}
                  widget={widget}
                  columnPx={columnPx}
                  rowPx={effectiveRowHeight}
                  maxColumns={layout.columns}
                  minSize={minSize}
                  onResize={(size) => handleResize(widget.slug, size, minSize)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </DashboardContextProvider>
  );
}

function EditableCell({
  widget,
  columnPx,
  rowPx,
  maxColumns,
  minSize,
  onResize,
}: {
  readonly widget: WidgetDefinition;
  readonly columnPx: number;
  readonly rowPx: number;
  readonly maxColumns: number;
  readonly minSize: WidgetSize;
  readonly onResize: (size: WidgetSize) => void;
}) {
  const cellStyle: CSSProperties = {
    gridColumn: `span ${widget.size.width}`,
    gridRow: `span ${widget.size.height}`,
  };
  return (
    <div data-slot="editable-dashboard-cell" data-widget-slug={widget.slug} style={cellStyle}>
      <SortableWidgetCell
        id={widget.slug}
        size={widget.size}
        columnPx={columnPx}
        rowPx={rowPx}
        gapPx={GRID_GAP_PX}
        maxWidth={maxColumns}
        minWidth={minSize.width}
        minHeight={minSize.height}
        onResize={onResize}
      >
        <WidgetRenderer widget={widget} />
      </SortableWidgetCell>
    </div>
  );
}
