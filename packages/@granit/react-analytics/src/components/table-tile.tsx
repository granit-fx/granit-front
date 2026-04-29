import {
  RenderedWidget,
  useWidgetRender,
  type WidgetRenderContext,
} from '@granit/react-dashboards';

import type { TableWidgetDefinition } from '@granit/analytics';

/**
 * Smart table tile — registered as the renderer for
 * `TableWidgetDefinition` (`type: 'table'`) in the analytics widget
 * registry (definition path).
 *
 * Symmetric with `<ChartTile>` / `<PivotTile>` / `<MapTile>`: calls
 * `POST /widgets/table/render` via {@link useWidgetRender}, dispatches
 * through `<RenderedWidget>`, leverages the same `<TableSnapshotWidget>`
 * the bundle path uses.
 */
export interface TableTileProps {
  readonly widget: TableWidgetDefinition;
  readonly context?: WidgetRenderContext;
}

export function TableTile({ widget, context }: TableTileProps) {
  const query = useWidgetRender('table', widget, context);

  if (query.isLoading) {
    return (
      <div
        data-slot="table-tile-skeleton"
        className="flex h-full w-full animate-pulse items-center justify-center rounded-md bg-accent text-xs text-muted-foreground"
        aria-hidden
      />
    );
  }
  if (query.isError) {
    return (
      <div
        data-slot="table-tile-error"
        className="flex h-full w-full items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
      >
        Failed to render widget.
      </div>
    );
  }
  if (!query.data) return null;

  return <RenderedWidget widget={query.data} framed={false} />;
}
