import {
  RenderedWidget,
  useWidgetRender,
  type WidgetRenderContext,
} from '@granit/react-dashboards';

import type { PivotWidgetDefinition } from '@granit/analytics';

/**
 * Smart pivot tile — registered as the renderer for
 * `PivotWidgetDefinition` (`type: 'pivot'`) in the analytics widget
 * registry (definition path).
 *
 * Symmetric with `<ChartTile>` / `<TableTile>` / `<MapTile>`: calls
 * `POST /analytics/widgets/pivot/render` via {@link useWidgetRender}, dispatches
 * through `<RenderedWidget>`, leverages the same `<PivotSnapshotWidget>`
 * the bundle path uses.
 */
export interface PivotTileProps {
  readonly widget: PivotWidgetDefinition;
  readonly context?: WidgetRenderContext;
}

export function PivotTile({ widget, context }: PivotTileProps) {
  const query = useWidgetRender('pivot', widget, context);

  if (query.isLoading) {
    return (
      <div
        data-slot="pivot-tile-skeleton"
        className="flex h-full w-full animate-pulse items-center justify-center rounded-md bg-accent text-xs text-muted-foreground"
        aria-hidden
      />
    );
  }
  if (query.isError) {
    return (
      <div
        data-slot="pivot-tile-error"
        className="flex h-full w-full items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
      >
        Failed to render widget.
      </div>
    );
  }
  if (!query.data) return null;

  return <RenderedWidget widget={query.data} framed={false} />;
}
