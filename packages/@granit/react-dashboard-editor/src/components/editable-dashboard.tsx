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
import { useMemo, type CSSProperties } from 'react';

import { reorderWidgets } from '../lib/reorder-widgets.js';

import { SortableWidgetCell } from './sortable-widget-cell.js';

import type { DashboardDefinition, WidgetDefinition } from '@granit/dashboards';

/**
 * Editor-mode dashboard. Mirrors the read-mode `<Dashboard>` from
 * `@granit/react-dashboards` (auto-flow CSS grid, widgets fill cells in
 * `position` order, each spans its declared `size.width × size.height`),
 * with two extras:
 *
 * - **dnd-kit-driven reorder**: each cell is a sortable item keyed by its
 *   `slug`. A small drag handle on the top-left initiates the gesture; the
 *   widget body itself stays interactive (links, popovers, click actions).
 * - **`onChange` callback**: emits a fresh `DashboardDefinition` whose
 *   widgets carry recomputed `position` ranks (0-based, contiguous) — ready
 *   to round-trip through the backend's widget-CRUD endpoints without a
 *   normalisation pass.
 *
 * v1 supports reorder only; resize and add/remove come in B5-C PRs 2 and 3.
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
   * Fires after a successful drag-end. Consumers update local state +
   * invalidate / persist via their own pipeline.
   */
  readonly onChange: (next: DashboardDefinition) => void;
  readonly className?: string;
  /** Override the row height (in pixels). Falls back to `definition.layout.rowHeight`. */
  readonly rowHeight?: number;
}

export function EditableDashboard({
  definition,
  onChange,
  className,
  rowHeight,
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
    gap: '1rem',
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = reorderWidgets(definition, String(active.id), String(over.id));
    if (next !== definition) onChange(next);
  };

  return (
    <DashboardContextProvider value={{ dashboardName: definition.name }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div
            data-slot="editable-dashboard"
            data-dashboard-name={definition.name}
            data-breakpoint={breakpoint}
            className={className}
            style={gridStyle}
          >
            {orderedWidgets.map((widget) => (
              <EditableCell key={widget.slug} widget={widget} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </DashboardContextProvider>
  );
}

function EditableCell({ widget }: { readonly widget: WidgetDefinition }) {
  const cellStyle: CSSProperties = {
    gridColumn: `span ${widget.size.width}`,
    gridRow: `span ${widget.size.height}`,
  };
  return (
    <div data-slot="editable-dashboard-cell" data-widget-slug={widget.slug} style={cellStyle}>
      <SortableWidgetCell id={widget.slug}>
        <WidgetRenderer widget={widget} />
      </SortableWidgetCell>
    </div>
  );
}
