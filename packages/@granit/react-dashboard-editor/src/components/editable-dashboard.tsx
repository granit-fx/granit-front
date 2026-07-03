import { DASHBOARD_TIME_WINDOW } from '@granit/dashboards';
import {
  DashboardContextProvider,
  DashboardRefreshToolbar,
  DashboardTimeWindowToolbar,
  resolveEffectiveLayout,
  useDashboardBreakpoint,
  useDashboardRefreshIntervalState,
  useDashboardTimeWindowState,
  WidgetRenderer,
} from '@granit/react-dashboards';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GridLayout } from 'react-grid-layout';

import { fromGridLayout, toGridLayout } from '../lib/grid-layout-bridge';
import { type WidgetCatalogEntry } from '../lib/widget-catalog';

import { GridStyles } from './grid-styles';
import { SortableWidgetCell } from './sortable-widget-cell';

import type { DashboardDefinition } from '@granit/dashboards';
import type { ReactNode, Ref } from 'react';
import type { Layout, ResizeHandleAxis } from 'react-grid-layout';

const GRID_MARGIN_PX = 16;
const DRAG_HANDLE_CLASS = 'granit-drag-handle';
/** Fallback container width before the ResizeObserver reports a real one (SSR / JSDOM). */
const FALLBACK_WIDTH_PX = 1200;
/** Eight resize handles — corners + edge midpoints, matching the luzmo/Grafana affordance. */
const RESIZE_HANDLES: readonly ResizeHandleAxis[] = ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne'];

/**
 * Editor-mode dashboard. Renders the widget pool on a coordinate grid
 * (`react-grid-layout`) with free placement and multi-edge resize:
 *
 * - **Drag-to-move** via a dedicated handle on each cell (the grid's
 *   `dragConfig.handle` selector), leaving the widget body interactive.
 * - **Resize** from any of the eight handles (corners + edges), snapped to
 *   grid cells, clamped to the catalog's per-kind minimum and a 12-row max.
 * - **`onChange`** fires a fresh {@link DashboardDefinition} whose widgets carry
 *   updated `x` / `y` / `size` plus a re-derived dense `position`, ready to
 *   round-trip through the widget-CRUD endpoints.
 *
 * Coordinates absent from the definition (hand-authored dashboards / fixtures)
 * are first-fit-packed on the fly, so existing dashboards render unchanged.
 * The same widget registry the read-mode `<RenderedDashboard>` uses drives the
 * renderers here.
 */
export interface EditableDashboardProps {
  readonly definition: DashboardDefinition;
  /**
   * Fires after a drag-move or resize settles. Consumers update local state +
   * persist via their own pipeline. Never fired for no-op layout events.
   */
  readonly onChange: (next: DashboardDefinition) => void;
  readonly className?: string;
  /** Override the row height (in pixels). Falls back to `definition.layout.rowHeight`. */
  readonly rowHeight?: number;
  /**
   * Widget catalog driving per-kind minimum sizes for the resize clamp. When
   * omitted (or a widget's type is absent), the floor is `1x1`.
   */
  readonly catalog?: readonly WidgetCatalogEntry[];
  /**
   * Per-widget hover-toolbar actions, called with the widget `slug`. Each
   * button appears only when its handler is supplied. Headless by design — the
   * parent owns behaviour (open a config drawer, confirm + `removeWidget`,
   * `duplicateWidget`, …).
   */
  readonly onEditWidget?: (slug: string) => void;
  readonly onDuplicateWidget?: (slug: string) => void;
  readonly onDeleteWidget?: (slug: string) => void;
}

export function EditableDashboard({
  definition,
  onChange,
  className,
  rowHeight,
  catalog,
  onEditWidget,
  onDuplicateWidget,
  onDeleteWidget,
}: EditableDashboardProps) {
  const breakpoint = useDashboardBreakpoint();

  // Preview time window for the editor canvas. Widgets render through the same
  // context path as read mode (`WidgetRenderer` → `useEffectiveTimeWindow`), so
  // the toolbar re-fetches every tile without editing the persisted definition.
  // Seeded from the dashboard's declared default, falling back to Last 30 days
  // so the selector always shows.
  const [timeWindow, setTimeWindow] = useDashboardTimeWindowState(
    definition.defaultTimeWindow ?? DASHBOARD_TIME_WINDOW.Last30Days
  );
  const [refreshInterval, setRefreshInterval] = useDashboardRefreshIntervalState('auto');

  const { layout, widgets: orderedWidgets } = useMemo(
    () => resolveEffectiveLayout(definition.layout, definition.widgets, breakpoint),
    [definition.layout, definition.widgets, breakpoint]
  );

  const gridLayout = useMemo(
    () => toGridLayout(orderedWidgets, layout.columns, catalog),
    [orderedWidgets, layout.columns, catalog]
  );

  const effectiveRowHeight = rowHeight ?? layout.rowHeight;

  // Live container width drives react-grid-layout's column maths. ResizeObserver
  // fires on mount + whenever the parent reflows; we fall back to a sane width
  // until it reports (SSR / JSDOM, where ResizeObserver is absent).
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Persist on settled user gestures only — NOT on `onLayoutChange`, which
  // also fires on mount and on every width reflow. With a controlled `layout`
  // prop driven by `definition`, handling `onLayoutChange` would feed every
  // mount-time normalisation straight back into `onChange` and loop.
  const handleSettle = (next: Layout) => {
    const updated = fromGridLayout(next, definition);
    if (updated !== definition) onChange(updated);
  };

  return (
    <DashboardContextProvider
      value={{
        dashboardName: definition.name,
        timeWindow,
        setTimeWindow,
        refreshInterval,
        setRefreshInterval,
      }}
    >
      <div
        ref={wrapperRef}
        data-slot="editable-dashboard"
        data-dashboard-name={definition.name}
        data-breakpoint={breakpoint}
        className={className}
      >
        <GridStyles />
        <div
          data-slot="dashboard-controls"
          className="mb-3 flex flex-wrap items-end justify-end gap-3"
        >
          <DashboardTimeWindowToolbar />
          <DashboardRefreshToolbar />
        </div>
        <GridLayout
          width={width || FALLBACK_WIDTH_PX}
          layout={gridLayout}
          onDragStop={handleSettle}
          onResizeStop={handleSettle}
          gridConfig={{
            cols: layout.columns,
            rowHeight: effectiveRowHeight,
            margin: [GRID_MARGIN_PX, GRID_MARGIN_PX],
            containerPadding: [0, 0],
          }}
          dragConfig={{ handle: `.${DRAG_HANDLE_CLASS}`, threshold: 5 }}
          resizeConfig={{ handles: RESIZE_HANDLES, handleComponent: renderResizeHandle }}
        >
          {orderedWidgets.map((widget) => (
            <SortableWidgetCell
              key={widget.slug}
              id={widget.slug}
              dragHandleClassName={DRAG_HANDLE_CLASS}
              onEdit={onEditWidget ? () => onEditWidget(widget.slug) : undefined}
              onDuplicate={onDuplicateWidget ? () => onDuplicateWidget(widget.slug) : undefined}
              onDelete={onDeleteWidget ? () => onDeleteWidget(widget.slug) : undefined}
            >
              <WidgetRenderer widget={widget} />
            </SortableWidgetCell>
          ))}
        </GridLayout>
      </div>
    </DashboardContextProvider>
  );
}

/**
 * Custom resize handle — positioned + themed by {@link GridStyles} (we can't
 * import react-grid-layout's stylesheet in workspace source). The grid attaches
 * its resize listener to `ref`.
 */
function renderResizeHandle(axis: ResizeHandleAxis, ref: Ref<HTMLElement>): ReactNode {
  return (
    <span
      ref={ref as Ref<HTMLSpanElement>}
      className={`react-resizable-handle react-resizable-handle-${axis}`}
      data-slot="sortable-widget-resize-handle"
      aria-hidden
    />
  );
}
