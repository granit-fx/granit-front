import { useCallback, useMemo, useState, type CSSProperties } from 'react';

import { useDashboardBreakpoint } from '../hooks/use-dashboard-breakpoint';
import { resolveActiveView } from '../lib/resolve-active-view';
import { resolveEffectiveLayout } from '../lib/resolve-effective-layout';

import { DashboardContextProvider, useDashboardTimeWindowState } from './dashboard-context';
import { DashboardTimeWindowToolbar } from './dashboard-time-window-toolbar';
import { DashboardViewProvider } from './dashboard-view-context';
import { WidgetRenderer } from './widget-renderer';

import type { DashboardDefinition, WidgetDefinition } from '@granit/dashboards';

export interface DashboardProps {
  readonly definition: DashboardDefinition;
  readonly className?: string;
  /**
   * Override the row height (in pixels). Falls back to the active
   * breakpoint's resolved row height (or the active view's layout
   * row height when the dashboard ships views).
   */
  readonly rowHeight?: number;
  /**
   * Active view name (controlled). Falls back to
   * `definition.defaultView`, then the first view, then null
   * (single-view dashboards). Required when the parent owns the view
   * state (URL-bound, breadcrumb-bound, etc.).
   */
  readonly currentView?: string;
  /**
   * Notification when an action handler or view switcher requests a
   * different view. When omitted, `<Dashboard>` falls back to internal
   * state — fine for self-contained demos.
   */
  readonly onViewChange?: (name: string) => void;
}

/**
 * Renders a {@link DashboardDefinition} as a CSS auto-flow grid.
 *
 * Pipeline:
 *
 * 1. **Active view** — {@link resolveActiveView} picks the view's
 *    widgets + layout from `definition.views[currentView]` (with the
 *    standard fallback chain: prop → `defaultView` → first view →
 *    top-level pool).
 * 2. **Active breakpoint** — {@link useDashboardBreakpoint} resolves
 *    the viewport class.
 * 3. **Effective layout** — {@link resolveEffectiveLayout} merges the
 *    active breakpoint's overrides over the view's layout (per-widget
 *    sizes, ordering, hidden slugs).
 *
 * Wraps children in a {@link DashboardContextProvider} so widget
 * renderers (and future TimeWindow / alias hooks) have a stable handle
 * on the active dashboard, plus a {@link DashboardViewProvider} so
 * action handlers and view switchers can read / write the active view.
 */
export function Dashboard({
  definition,
  className,
  rowHeight,
  currentView,
  onViewChange,
}: DashboardProps) {
  // Internal view state for uncontrolled usage. Initial value follows
  // the same fallback chain `resolveActiveView` uses, so the very first
  // render picks the right view without an extra reconciliation.
  const [internalView, setInternalView] = useState<string | null>(
    currentView ?? definition.defaultView ?? definition.views?.[0]?.name ?? null
  );
  const activeViewName = currentView ?? internalView;

  const setView = useCallback(
    (name: string) => {
      if (currentView === undefined) setInternalView(name);
      onViewChange?.(name);
    },
    [currentView, onViewChange]
  );

  // Time window in effect for every data-bound widget. Seeded from the
  // dashboard's declared default; a `null`/absent default leaves it undefined,
  // so widgets keep their `useEffectiveTimeWindow` fallback and no selector is
  // shown — filter-less dashboards render exactly as before.
  const [timeWindow, setTimeWindow] = useDashboardTimeWindowState(
    definition.defaultTimeWindow ?? undefined
  );

  const breakpoint = useDashboardBreakpoint();

  const {
    layout: viewLayout,
    widgets: viewWidgets,
    resolvedView,
  } = useMemo(() => {
    const active = resolveActiveView(definition, activeViewName);
    return {
      layout: active.layout,
      widgets: active.widgets,
      resolvedView: active.activeViewName,
    };
  }, [definition, activeViewName]);

  const { layout, widgets } = useMemo(
    () => resolveEffectiveLayout(viewLayout, viewWidgets, breakpoint),
    [viewLayout, viewWidgets, breakpoint]
  );

  const effectiveRowHeight = rowHeight ?? layout.rowHeight;

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridAutoFlow: 'dense',
    gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
    gridAutoRows: `${effectiveRowHeight}px`,
    gap: '1rem',
  };

  return (
    <DashboardContextProvider value={{ dashboardName: definition.name, timeWindow, setTimeWindow }}>
      <DashboardViewProvider value={{ currentView: resolvedView, setCurrentView: setView }}>
        {timeWindow && <DashboardTimeWindowToolbar />}
        <div
          data-slot="dashboard"
          data-dashboard-name={definition.name}
          data-breakpoint={breakpoint}
          data-current-view={resolvedView ?? undefined}
          className={className}
          style={gridStyle}
        >
          {widgets.map((widget) => (
            <DashboardCell key={widget.slug} widget={widget}>
              <WidgetRenderer widget={widget} />
            </DashboardCell>
          ))}
        </div>
      </DashboardViewProvider>
    </DashboardContextProvider>
  );
}

function DashboardCell({
  widget,
  children,
}: {
  readonly widget: WidgetDefinition;
  readonly children: React.ReactNode;
}) {
  const cellStyle: CSSProperties = {
    gridColumn: `span ${widget.size.width}`,
    gridRow: `span ${widget.size.height}`,
  };
  return (
    <div data-slot="dashboard-cell" data-widget-slug={widget.slug} style={cellStyle}>
      {children}
    </div>
  );
}
