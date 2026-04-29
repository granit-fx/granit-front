import { useMemo, type CSSProperties } from 'react';

import { useDashboardBreakpoint } from '../hooks/use-dashboard-breakpoint.js';
import { resolveEffectiveLayout } from '../lib/resolve-effective-layout.js';

import { DashboardContextProvider } from './dashboard-context.js';
import { WidgetRenderer } from './widget-renderer.js';

import type { DashboardDefinition, WidgetDefinition } from '@granit/dashboards';

export interface DashboardProps {
  readonly definition: DashboardDefinition;
  readonly className?: string;
  /**
   * Override the row height (in pixels). Falls back to the active
   * breakpoint's resolved row height (or `definition.layout.rowHeight`
   * when the dashboard ships no breakpoint overrides).
   */
  readonly rowHeight?: number;
}

/**
 * Renders a {@link DashboardDefinition} as a CSS auto-flow grid.
 *
 * Resolves the active {@link DashboardBreakpoint} via
 * {@link useDashboardBreakpoint} and merges
 * `definition.layout.breakpoints[active]` over the base via
 * {@link resolveEffectiveLayout}. Per-breakpoint overrides apply:
 *
 * - **columns / rowHeight** — replace the base for the active viewport.
 * - **widgetSizes** — replace per-widget `size` for the active layout.
 * - **widgetOrder** — replace the rendered order; un-listed widgets
 *   keep their declared `position`.
 * - **hiddenWidgets** — slugs are dropped from the layout but stay in
 *   the widget pool (state survives a viewport flip back).
 *
 * Wraps children in a {@link DashboardContextProvider} so widget
 * renderers (and future TimeWindow / alias hooks) have a stable handle
 * on the active dashboard.
 */
export function Dashboard({ definition, className, rowHeight }: DashboardProps) {
  const breakpoint = useDashboardBreakpoint();

  const { layout, widgets } = useMemo(
    () => resolveEffectiveLayout(definition.layout, definition.widgets, breakpoint),
    [definition.layout, definition.widgets, breakpoint]
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
    <DashboardContextProvider value={{ dashboardName: definition.name }}>
      <div
        data-slot="dashboard"
        data-dashboard-name={definition.name}
        data-breakpoint={breakpoint}
        className={className}
        style={gridStyle}
      >
        {widgets.map((widget) => (
          <DashboardCell key={widget.slug} widget={widget}>
            <WidgetRenderer widget={widget} />
          </DashboardCell>
        ))}
      </div>
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
