import { WidgetRenderer } from './widget-renderer.js';

import type {
  DashboardDefinition,
  DashboardLayoutItem,
  WidgetDefinition,
} from '@granit/dashboards';
import type { CSSProperties } from 'react';

const DEFAULT_ROW_HEIGHT_PX = 80;

export interface DashboardProps {
  readonly definition: DashboardDefinition;
  readonly className?: string;
  /**
   * Override the row height (in pixels). Falls back to `definition.layout.rowHeight`
   * and finally to {@link DEFAULT_ROW_HEIGHT_PX}. The grid columns scale to
   * available width; only row height is fixed so widget heights remain stable
   * across viewport changes.
   */
  readonly rowHeight?: number;
}

/**
 * Renders a {@link DashboardDefinition} as a CSS grid.
 *
 * v1 implementation — static grid, no drag/drop, no responsive recomputation
 * (the browser's native `repeat(N, 1fr)` already handles width scaling). v2 will
 * swap this for `react-grid-layout` to enable drag/resize/persist; the public
 * API (just pass a `definition`) remains stable across that swap.
 *
 * Widgets whose layout item has no matching `WidgetDefinition.id` are silently
 * skipped — that's the cheap path for backend-driven layouts where a widget
 * was deleted but its layout item lingers in transit.
 */
export function Dashboard({ definition, className, rowHeight }: DashboardProps) {
  const widgetsById = indexWidgetsById(definition.widgets);
  const effectiveRowHeight = rowHeight ?? definition.layout.rowHeight ?? DEFAULT_ROW_HEIGHT_PX;

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${definition.layout.columns}, minmax(0, 1fr))`,
    gridAutoRows: `${effectiveRowHeight}px`,
    gap: '1rem',
  };

  return (
    <div
      data-slot="dashboard"
      data-dashboard-id={definition.id}
      className={className}
      style={gridStyle}
    >
      {definition.layout.items.map((item) => {
        const widget = widgetsById.get(item.widgetId);
        if (!widget) return null;
        return (
          <DashboardCell key={item.widgetId} item={item}>
            <WidgetRenderer widget={widget} />
          </DashboardCell>
        );
      })}
    </div>
  );
}

function DashboardCell({
  item,
  children,
}: {
  readonly item: DashboardLayoutItem;
  readonly children: React.ReactNode;
}) {
  const cellStyle: CSSProperties = {
    gridColumn: `${item.position.x + 1} / span ${item.position.width}`,
    gridRow: `${item.position.y + 1} / span ${item.position.height}`,
  };
  return (
    <div data-slot="dashboard-cell" style={cellStyle}>
      {children}
    </div>
  );
}

function indexWidgetsById(widgets: readonly WidgetDefinition[]): Map<string, WidgetDefinition> {
  const map = new Map<string, WidgetDefinition>();
  for (const widget of widgets) map.set(widget.id, widget);
  return map;
}
