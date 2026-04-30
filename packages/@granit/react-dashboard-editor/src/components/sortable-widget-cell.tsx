import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

import type { WidgetSize } from '@granit/dashboards';

/**
 * Wraps a widget cell in dnd-kit's {@link useSortable} hook so a
 * {@link DndContext} → {@link SortableContext} parent can drive reordering
 * by `slug`. The dedicated drag-handle markup (a small grip on the top-left
 * of the cell) keeps interactive content inside the widget (links, popovers,
 * chart tooltips) free of pointer hijacking.
 *
 * When `onResize` is wired, a bottom-right resize handle is rendered
 * alongside the drag handle. The gesture snaps to integer cells using the
 * grid metrics passed via `columnPx` / `rowPx` / `gapPx`. Live updates
 * fire on every pointer move so the grid reflows under the cursor; on
 * release no extra event is needed since the parent already holds the
 * latest size.
 *
 * The `id` prop is the widget's `slug` — stable across reorders, matches
 * the `WidgetDefinitionBase.slug` invariant.
 */
export interface SortableWidgetCellProps {
  readonly id: string;
  readonly children: ReactNode;
  /**
   * Current widget size in grid cells. Required when `onResize` is set;
   * ignored otherwise.
   */
  readonly size?: WidgetSize;
  /**
   * Called with the new size on every pointer move during a resize
   * gesture. Snapped to integer cells. Wire into the same controlled-
   * state pipeline as `onChange` on `<EditableDashboard>`.
   */
  readonly onResize?: (size: WidgetSize) => void;
  /** Pixel width of one grid column. */
  readonly columnPx?: number;
  /** Pixel height of one grid row. */
  readonly rowPx?: number;
  /** Pixel gap between cells (CSS `gap`). */
  readonly gapPx?: number;
  /** Maximum width in cells — typically `definition.layout.columns`. */
  readonly maxWidth?: number;
}

const MAX_HEIGHT = 12;

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function SortableWidgetCell({
  id,
  children,
  size,
  onResize,
  columnPx,
  rowPx,
  gapPx = 16,
  maxWidth,
}: SortableWidgetCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const startRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!onResize || !size || !columnPx || !rowPx) return;
      event.preventDefault();
      event.stopPropagation();
      startRef.current = {
        x: event.clientX,
        y: event.clientY,
        width: size.width,
        height: size.height,
      };
      const cap = event.currentTarget;
      cap.setPointerCapture(event.pointerId);
      const onMove = (ev: PointerEvent) => {
        if (!startRef.current) return;
        const dx = ev.clientX - startRef.current.x;
        const dy = ev.clientY - startRef.current.y;
        const stepX = columnPx + gapPx;
        const stepY = rowPx + gapPx;
        const nextWidth = clamp(startRef.current.width + Math.round(dx / stepX), 1, maxWidth ?? 12);
        const nextHeight = clamp(startRef.current.height + Math.round(dy / stepY), 1, MAX_HEIGHT);
        onResize({ width: nextWidth, height: nextHeight });
      };
      const onUp = (ev: PointerEvent) => {
        startRef.current = null;
        if (cap.hasPointerCapture(ev.pointerId)) cap.releasePointerCapture(ev.pointerId);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [onResize, size, columnPx, rowPx, gapPx, maxWidth]
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  const canResize = Boolean(onResize && size && columnPx && rowPx);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-slot="sortable-widget-cell"
      data-widget-slug={id}
      data-dragging={isDragging || undefined}
      className="group/cell relative"
    >
      <button
        type="button"
        data-slot="sortable-widget-handle"
        aria-label={`Drag widget ${id}`}
        className="absolute left-1 top-1 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/cell:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon />
      </button>
      {children}
      {canResize ? (
        <button
          type="button"
          data-slot="sortable-widget-resize-handle"
          aria-label={`Resize widget ${id}`}
          onPointerDown={handleResizePointerDown}
          className="absolute bottom-0 right-0 z-10 flex h-4 w-4 cursor-se-resize items-center justify-center rounded-tl-md text-muted-foreground/40 opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/cell:opacity-100"
        >
          <ResizeCornerIcon />
        </button>
      ) : null}
    </div>
  );
}

function GripVerticalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

function ResizeCornerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="20" y1="20" x2="20" y2="14" />
      <line x1="20" y1="20" x2="14" y2="20" />
      <line x1="20" y1="20" x2="9" y2="9" />
    </svg>
  );
}
