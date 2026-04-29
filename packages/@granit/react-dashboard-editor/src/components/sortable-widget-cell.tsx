import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type ReactNode } from 'react';

/**
 * Wraps a widget cell in dnd-kit's {@link useSortable} hook so a
 * {@link DndContext} → {@link SortableContext} parent can drive reordering
 * by `slug`. The dedicated drag-handle markup (a small grip on the top-left
 * of the cell) keeps interactive content inside the widget (links, popovers,
 * chart tooltips) free of pointer hijacking.
 *
 * The `id` prop is the widget's `slug` — stable across reorders, matches
 * the `WidgetDefinitionBase.slug` invariant.
 */
export interface SortableWidgetCellProps {
  readonly id: string;
  readonly children: ReactNode;
}

export function SortableWidgetCell({ id, children }: SortableWidgetCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-slot="sortable-widget-cell"
      data-widget-slug={id}
      data-dragging={isDragging || undefined}
      className="relative"
    >
      <button
        type="button"
        data-slot="sortable-widget-handle"
        aria-label={`Drag widget ${id}`}
        className="absolute left-2 top-2 z-10 cursor-grab rounded-md border bg-card/80 px-1.5 py-0.5 text-xs text-muted-foreground shadow-sm hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      {children}
    </div>
  );
}
