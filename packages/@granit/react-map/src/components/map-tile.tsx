import {
  RenderedWidget,
  useWidgetRender,
  type WidgetRenderContext,
} from '@granit/react-dashboards';

import type { MapWidgetDefinition } from '@granit/analytics';

/**
 * Smart map tile — registered as the renderer for
 * `MapWidgetDefinition` (`type: 'map'`) in the map widget registry
 * (definition path).
 *
 * Symmetric with the analytics tiles (`<ChartTile>`, `<TableTile>`,
 * `<PivotTile>`): calls `POST /analytics/widgets/map/render` via
 * {@link useWidgetRender}, dispatches through `<RenderedWidget>`,
 * leverages the same `<MapSnapshotWidget>` the bundle path uses.
 *
 * The `<MapTileProvider>` (multi-provider context shipped from
 * `@granit/react-map`) still drives tile-layer selection inside
 * `<MapSnapshotWidget>` — the rendered envelope only carries the
 * snapshot points / camera / threshold, not the active provider.
 */
export interface MapTileProps {
  readonly widget: MapWidgetDefinition;
  readonly context?: WidgetRenderContext;
}

export function MapTile({ widget, context }: MapTileProps) {
  const query = useWidgetRender('map', widget, context);

  if (query.isLoading) {
    return (
      <div
        data-slot="map-tile-skeleton"
        className="flex h-full w-full animate-pulse items-center justify-center rounded-md bg-accent text-xs text-muted-foreground"
        aria-hidden
      />
    );
  }
  if (query.isError) {
    return (
      <div
        data-slot="map-tile-error"
        className="flex h-full w-full items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
      >
        Failed to render widget.
      </div>
    );
  }
  if (!query.data) return null;

  return <RenderedWidget widget={query.data} framed={false} />;
}
