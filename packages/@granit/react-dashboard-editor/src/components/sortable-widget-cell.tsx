import { useTranslation } from 'react-i18next';

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
 * starts a move gesture, plus an on-hover **action toolbar** (edit / duplicate /
 * delete) on the top-right — each button shown only when its callback is wired.
 * The toolbar is headless: it emits intent, the parent owns behaviour (open a
 * config drawer, confirm a delete, etc.).
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
  /** Show an Edit action; called with no args (the parent knows the slug). */
  readonly onEdit?: () => void;
  /** Show a Duplicate action. */
  readonly onDuplicate?: () => void;
  /** Show a Delete action. */
  readonly onDelete?: () => void;
  readonly children?: ReactNode;
}

export function SortableWidgetCell({
  id,
  children,
  className,
  dragHandleClassName,
  onEdit,
  onDuplicate,
  onDelete,
  ...rest
}: SortableWidgetCellProps) {
  const { t } = useTranslation();
  const root = ['group/cell relative h-full', className].filter(Boolean).join(' ');
  const handle = [
    'absolute left-1 top-1 z-20 flex h-7 items-center gap-1 rounded px-1 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/cell:opacity-100 cursor-move',
    dragHandleClassName,
  ]
    .filter(Boolean)
    .join(' ');
  const hasToolbar = Boolean(onEdit || onDuplicate || onDelete);

  return (
    <div data-slot="editable-dashboard-cell" data-widget-slug={id} className={root} {...rest}>
      <button
        type="button"
        data-slot="sortable-widget-handle"
        aria-label={t('Dashboards.Widget.Move', { defaultValue: 'Move widget {{slug}}', slug: id })}
        className={handle}
      >
        <MoveIcon />
      </button>

      {hasToolbar ? (
        <div
          data-slot="widget-action-toolbar"
          className="absolute right-1 top-1 z-20 flex items-center gap-0.5 rounded-md border bg-card/95 p-0.5 opacity-0 shadow-sm transition-opacity focus-within:opacity-100 group-hover/cell:opacity-100"
        >
          {onEdit ? (
            <ToolbarButton
              dataSlot="widget-action-edit"
              label={t('Common.Edit', { defaultValue: 'Edit' })}
              onClick={onEdit}
            >
              <PencilIcon />
            </ToolbarButton>
          ) : null}
          {onDuplicate ? (
            <ToolbarButton
              dataSlot="widget-action-duplicate"
              label={t('Common.Duplicate', { defaultValue: 'Duplicate' })}
              onClick={onDuplicate}
            >
              <CopyIcon />
            </ToolbarButton>
          ) : null}
          {onDelete ? (
            <ToolbarButton
              dataSlot="widget-action-delete"
              label={t('Common.Delete', { defaultValue: 'Delete' })}
              onClick={onDelete}
              destructive
            >
              <TrashIcon />
            </ToolbarButton>
          ) : null}
        </div>
      ) : null}

      {children}
    </div>
  );
}

function ToolbarButton({
  dataSlot,
  label,
  onClick,
  destructive,
  children,
}: {
  readonly dataSlot: string;
  readonly label: string;
  readonly onClick: () => void;
  readonly destructive?: boolean;
  readonly children: ReactNode;
}) {
  const tone = destructive
    ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
    : 'text-muted-foreground hover:bg-accent hover:text-foreground';
  return (
    <button
      type="button"
      data-slot={dataSlot}
      aria-label={label}
      title={label}
      // Keep a press on the toolbar from bubbling into a grid drag/select.
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onClick}
      className={`flex h-6 w-6 items-center justify-center rounded ${tone}`}
    >
      {children}
    </button>
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

function PencilIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function CopyIcon() {
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
      <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function TrashIcon() {
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
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}
