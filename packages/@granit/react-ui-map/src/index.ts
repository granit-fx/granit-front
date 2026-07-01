// ---------------------------------------------------------------------------
// @granit/react-ui-map — public API
// ---------------------------------------------------------------------------

// Snapshot renderer (B5-B PR 4 — Map kind for <RenderedDashboard>)
export { MapSnapshotWidget } from './snapshot/map-snapshot-widget';
export { defaultMapSnapshotWidgetRegistry } from './snapshot/default-map-snapshot-widget-registry';

// Definition-path renderer (P3) — fetches via POST /analytics/widgets/map/render
export { MapTile } from './components/map-tile';
export type { MapTileProps } from './components/map-tile';
export { defaultMapWidgetRegistry } from './registry/default-map-widget-registry';

// Tile provider context — apps select the active provider once at the root
export { MapTileSourceProvider, useMapTileProvider } from './components/map-tile-provider-context';
export type { MapTileSourceProviderProps } from './components/map-tile-provider-context';

// Built-in providers
export { osmProvider } from './providers/osm-provider';
export { spwProvider } from './providers/spw-provider';
export { arcGisProvider } from './providers/arcgis-provider';

// Provider / layer types — apps compose custom providers with this shape
export type { MapTileLayer, MapTileLayerKind, MapTileProvider } from './types/index';
