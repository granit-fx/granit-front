import { cn } from '@granit/utils';

import type { ReactNode } from 'react';


// `<EntityPageLayout>` doesn't set max-width itself — Layout's outer
// content wrapper detects `[data-content-width=…]` via `:has()` and
// adapts. The shell only owns the vertical structure (gap, slots) and
// — for `full` width — its own padding (Layout drops it). Comfortable
// + narrow inherit Layout's standard padding.
const PADDING_CLASSES = {
  full: 'px-4 py-6 sm:px-6 lg:px-8',
  comfortable: '',
  narrow: '',
} as const;

export type EntityPageLayoutWidth = keyof typeof PADDING_CLASSES;

export interface EntityPageLayoutProps {
  /**
   * Heading shown in the top-left of the page. Optional — when omitted
   * the entire `<header>` row is skipped, useful for surfaces (e.g.
   * detail pages) where the body already renders its own title row.
   */
  readonly title?: ReactNode;
  /** Muted text under the title (entity subtitle / page hint). */
  readonly subtitle?: ReactNode;
  /**
   * Back navigation slot above the title row (e.g. an `<ArrowLeft />`
   * button that returns to the list). Omitted on the list page.
   */
  readonly back?: ReactNode;
  /**
   * Top-right actions — `Create`, `Import`, `Export`, `Save`, manifest
   * actions like `Download PDF`. Always horizontal flex with `gap-2`.
   */
  readonly actions?: ReactNode;
  /**
   * View-kind switcher (List / Kanban / Calendar / Map / Saved view).
   * Sits between the title row and the query controls. Hidden on
   * detail / form pages; on the list page hides itself when only one
   * view is registered.
   */
  readonly viewSwitcher?: ReactNode;
  /**
   * Query controls — search bar, filter presets, sort, group, record
   * count. List-only: the slot stays empty on detail / form.
   */
  readonly queryControls?: ReactNode;
  /** Page body — the view-specific renderer (table, cards, …). */
  readonly children: ReactNode;
  /**
   * Bottom-aligned pagination (or any "below the body" footer). List-only.
   */
  readonly pagination?: ReactNode;
  /**
   * Maximum content width:
   * - `full` — no max-width (data lists, kanban, calendar)
   * - `comfortable` — `max-w-7xl` (detail pages — cards in a 2-col grid)
   * - `narrow` — `max-w-4xl` (forms)
   */
  readonly contentWidth?: EntityPageLayoutWidth;
  /** Optional class on the shell root. */
  readonly className?: string;
  /** `data-slot` override (default `entity-page-layout`). */
  readonly dataSlot?: string;
}

// Unified page layout for the workspace entity surfaces (list / detail
// / form). Defines fixed slot positions so every view — current
// `<EntityList />`, future `<EntityKanban />` / `<EntityCalendar />` /
// `<EntityMap />` / saved views — finds its title, actions, query
// controls, body, and pagination at the same coordinates. Only the
// body content swaps per view kind; the user's mental model stays
// stable across navigations.
//
// `contentWidth` controls the wrapper's max-width. Lists get `full`
// for data density; detail pages get `comfortable` to stay readable
// at large viewports; forms get `narrow` to keep eye tracking tight.
export function EntityPageLayout({
  title,
  subtitle,
  back,
  actions,
  viewSwitcher,
  queryControls,
  children,
  pagination,
  contentWidth = 'full',
  className,
  dataSlot = 'entity-page-layout',
}: EntityPageLayoutProps) {
  return (
    <div
      data-slot={dataSlot}
      data-content-width={contentWidth}
      className={cn('flex w-full flex-col gap-6', PADDING_CLASSES[contentWidth], className)}
    >
      {back && (
        <div data-slot="entity-page-back" className="flex items-center gap-2">
          {back}
        </div>
      )}

      {(title || actions || subtitle) && (
        <header
          data-slot="entity-page-header"
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div className="min-w-0 space-y-1">
            {title &&
              (typeof title === 'string' ? (
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
              ) : (
                title
              ))}
            {subtitle && (
              <div className="text-sm text-muted-foreground">
                {typeof subtitle === 'string' ? <p>{subtitle}</p> : subtitle}
              </div>
            )}
          </div>
          {actions && (
            <div data-slot="entity-page-actions" className="flex flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </header>
      )}

      {viewSwitcher && (
        <div data-slot="entity-page-view-switcher" className="border-b">
          {viewSwitcher}
        </div>
      )}

      {queryControls && (
        <div data-slot="entity-page-query-controls" className="flex flex-col gap-3">
          {queryControls}
        </div>
      )}

      <div data-slot="entity-page-body" className="flex flex-1 flex-col">
        {children}
      </div>

      {pagination && (
        <div
          data-slot="entity-page-pagination"
          className="flex items-center justify-end border-t pt-4"
        >
          {pagination}
        </div>
      )}
    </div>
  );
}
