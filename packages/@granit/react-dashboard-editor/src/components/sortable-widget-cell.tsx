import type { ComponentPropsWithRef, ReactNode } from 'react';

/**
 * A single editable grid cell — the direct child `react-grid-layout` clones to
 * inject positioning (`style`/`className`), drag listeners and the resize
 * handles. It therefore spreads every prop it receives onto its root element
 * and forwards `ref`, so the grid can drive drag/resize transparently.
 *
 * On top of that it renders a dedicated **drag handle** (a grip on the top-left
 * carrying {@link dragHandleClassName}, which the grid's `dragConfig.handle`
 * selector targets) so the widget body stays interactive and only the handle
 * starts a move gesture.
 *
 * `id` is the widget's `slug` — stable across reorders, surfaced as
 * `data-widget-slug` and in the handle's `aria-label`. It is intentionally not
 * forwarded to the DOM `id` attribute.
 */
export interface SortableWidgetCellProps extends Omit<ComponentPropsWithRef<'div'>, 'id'> {
  /** Widget slug — the grid item identity. */
  readonly id: string;
  /** Class the grid's `dragConfig.handle` selector matches (e.g. `granit-drag-handle`). */
  readonly dragHandleClassName?: string;
  readonly children?: ReactNode;
}

export function SortableWidgetCell({
  id,
  children,
  className,
  dragHandleClassName,
  ...rest
}: SortableWidgetCellProps) {
  const root = ['group/cell relative h-full', className].filter(Boolean).join(' ');
  const handle = [
    'absolute left-1 top-1 z-20 flex h-7 items-center gap-1 rounded px-1 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/cell:opacity-100 cursor-move',
    dragHandleClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-slot="editable-dashboard-cell" data-widget-slug={id} className={root} {...rest}>
      <button
        type="button"
        data-slot="sortable-widget-handle"
        aria-label={`Drag widget ${id}`}
        className={handle}
      >
        <MoveIcon />
      </button>
      {children}
    </div>
  );
}

function MoveIcon() {
  // lucide "move" — four-way arrows; clear drag-to-move affordance.
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
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <line x1="12" x2="12" y1="2" y2="22" />
    </svg>
  );
}
