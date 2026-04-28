import { useMemo, type CSSProperties } from 'react';

import { DashboardContextProvider } from './dashboard-context.js';
import { WidgetRenderer } from './widget-renderer.js';

import type { DashboardDefinition, WidgetDefinition } from '@granit/dashboards';

export interface DashboardProps {
  readonly definition: DashboardDefinition;
  readonly className?: string;
  /**
   * Override the row height (in pixels). Falls back to
   * `definition.layout.rowHeight`. The grid columns scale to available width;
   * only row height is fixed so widget heights remain stable across viewport
   * changes.
   */
  readonly rowHeight?: number;
}

/**
 * Renders a {@link DashboardDefinition} as a CSS auto-flow grid.
 *
 * v1 implementation — widgets fill the grid in `position` order, each taking
 * its declared `size.width × size.height`. The browser handles placement via
 * `grid-auto-flow: dense`. v2 will swap this for `react-grid-layout` to
 * enable drag/resize/persist; the public API (just pass a `definition`)
 * remains stable across that swap.
 *
 * Wraps children in a {@link DashboardContextProvider} so widget renderers
 * (and future TimeWindow / alias hooks) have a stable handle on the active
 * dashboard.
 */
export function Dashboard({ definition, className, rowHeight }: DashboardProps) {
  const orderedWidgets = useMemo(() => sortByPosition(definition.widgets), [definition.widgets]);
  const effectiveRowHeight = rowHeight ?? definition.layout.rowHeight;

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridAutoFlow: 'dense',
    gridTemplateColumns: `repeat(${definition.layout.columns}, minmax(0, 1fr))`,
    gridAutoRows: `${effectiveRowHeight}px`,
    gap: '1rem',
  };

  return (
    <DashboardContextProvider value={{ dashboardName: definition.name }}>
      <div
        data-slot="dashboard"
        data-dashboard-name={definition.name}
        className={className}
        style={gridStyle}
      >
        {orderedWidgets.map((widget) => (
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

function sortByPosition(widgets: readonly WidgetDefinition[]): readonly WidgetDefinition[] {
  // Stable sort on `position` so authors can declare widgets in any order in
  // their definition and the renderer respects the explicit `Position`.
  return [...widgets].sort((a, b) => a.position - b.position);
}
