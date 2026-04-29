// ---------------------------------------------------------------------------
// @granit/react-map — public API
// ---------------------------------------------------------------------------

// Snapshot renderer (B5-B PR 4 — Map kind for <RenderedDashboard>)
export { MapSnapshotWidget } from './snapshot/map-snapshot-widget.js';
export { defaultMapSnapshotWidgetRegistry } from './snapshot/default-map-snapshot-widget-registry.js';

// Definition-path renderer (P3) — fetches via POST /widgets/map/render
export { MapTile } from './components/map-tile.js';
export type { MapTileProps } from './components/map-tile.js';
export { defaultMapWidgetRegistry } from './registry/default-map-widget-registry.js';

// Tile provider context — apps select the active provider once at the root
export {
  MapTileProviderProvider,
  useMapTileProvider,
} from './components/map-tile-provider-context.js';
export type { MapTileProviderProviderProps } from './components/map-tile-provider-context.js';

// Built-in providers
export { osmProvider } from './providers/osm-provider.js';
export { spwProvider } from './providers/spw-provider.js';
export { arcGisProvider } from './providers/arcgis-provider.js';

// Provider / layer types — apps compose custom providers with this shape
export type { MapTileLayer, MapTileLayerKind, MapTileProvider } from './types.js';
