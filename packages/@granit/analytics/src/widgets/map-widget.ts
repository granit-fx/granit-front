import type { WidgetDefinitionBase } from '@granit/dashboards';

/**
 * Wire-format enum for the **default layer kind** preference shipped on
 * `MapWidgetDefinition` / `MapWidgetSnapshot` (B7-3, granit-dotnet
 * `Granit.Analytics.Dashboards.Widgets.MapTileLayerKind`). PascalCase wire
 * values per ADR-039 §6.1.
 *
 * Lives in `@granit/analytics` as the canonical wire identity. Editor-side
 * concerns (`@granit/react-map`) re-export the same union so a single
 * source of truth drives both the wire shape and the runtime layer
 * resolution.
 *
 * The frontend resolves at render time:
 *
 *     provider.layers.find(l => l.kind === defaultLayerKind) ?? provider.layers[0]
 *
 * — so a widget configured for `'Satellite'` falls back gracefully when the
 * active provider only ships a `'Plan'` layer (e.g. OSM); never blocks the
 * render.
 */
export type MapTileLayerKind = 'Plan' | 'Satellite' | 'Hybrid' | 'Topo' | 'Custom';

/**
 * Describes how a {@link MapWidgetDefinition} reads coordinates from the rows
 * produced by its backing query. Mirrors
 * `Granit.Analytics.Dashboards.Widgets.MapPointSource`.
 *
 * Two flavours per B7. The default {@link LatLngMapPointSource} maps to plain
 * decimal columns and works on any database. The opt-in
 * {@link GeographyMapPointSource} reads a single PostGIS `geography(Point)`
 * column — unlocks server-side spatial filters but is PostGIS-only.
 *
 * Wire format uses the `kind` discriminator with kebab tags (`'lat-lng'` /
 * `'geography'`) — same convention as `Datasource`.
 */
export interface LatLngMapPointSource {
  readonly kind: 'lat-lng';
  /** Column name carrying the latitude in decimal degrees. */
  readonly latitudeColumn: string;
  /** Column name carrying the longitude in decimal degrees. */
  readonly longitudeColumn: string;
}

export interface GeographyMapPointSource {
  readonly kind: 'geography';
  /** Column name of the PostGIS `geography(Point)` column. */
  readonly geographyColumn: string;
}

export type MapPointSource = LatLngMapPointSource | GeographyMapPointSource;

export function isLatLngMapPointSource(source: MapPointSource): source is LatLngMapPointSource {
  return source.kind === 'lat-lng';
}

export function isGeographyMapPointSource(
  source: MapPointSource
): source is GeographyMapPointSource {
  return source.kind === 'geography';
}

/**
 * Latitude / longitude pair seeding {@link MapWidgetDefinition.defaultCenter}.
 * Mirrors `Granit.Analytics.Dashboards.Widgets.MapCenter` — backend rejects
 * coordinates outside `[-90, 90]` / `[-180, 180]` at construction.
 */
export interface MapCenter {
  /** Latitude in decimal degrees, in `[-90, 90]`. */
  readonly latitude: number;
  /** Longitude in decimal degrees, in `[-180, 180]`. */
  readonly longitude: number;
}

/**
 * Map widget — renders geocoded query rows as markers on an interactive
 * map. Mirrors `Granit.Analytics.Dashboards.Widgets.MapWidgetDefinition`
 * (B7-2). Bound to a `QueryDefinition` by name (same pattern as
 * `TableWidgetDefinition`); the row shape determines how coordinates are
 * read via {@link pointSource}.
 *
 * Configuration is intentionally narrow at v1: cluster threshold, default
 * camera (zoom + center), popup template, optional detail-route, optional
 * tile-URL override. Permission filtering and per-widget overrides come
 * from the parent `WidgetDefinitionBase`.
 */
export interface MapWidgetDefinition extends WidgetDefinitionBase {
  readonly type: 'map';
  /** The `QueryDefinition.Name` backing this map. */
  readonly queryName: string;
  /** How rows expose coordinates — lat/lng pair or PostGIS geography column. */
  readonly pointSource: MapPointSource;
  /**
   * Whitelisted column names rendered in the marker popup, in order.
   * `null` = no popup body beyond the entity id.
   */
  readonly popupColumns: readonly string[] | null;
  /** Initial map zoom (Leaflet scale: 0 world → 18 building). Defaults to `5`. */
  readonly defaultZoom?: number;
  /**
   * Initial map center as `(latitude, longitude)`. `null` falls back to the
   * bounding box of the rendered points.
   */
  readonly defaultCenter?: MapCenter | null;
  /**
   * Row count above which marker clustering activates automatically.
   * Defaults to `200` on the backend.
   */
  readonly clusterThreshold?: number;
  /**
   * Optional route template invoked on marker click — `{id}` is substituted
   * with the row's primary key. Example: `'/customers/{id}'`.
   */
  readonly detailRoute?: string | null;
  /**
   * Optional Leaflet tile-URL template overriding the OpenStreetMap default.
   * Frontend hosts MUST keep a visible attribution that matches the tile
   * provider's licence.
   */
  readonly tileUrlTemplate?: string | null;
  /**
   * Preferred layer kind to mount by default when the active
   * `MapTileProvider` (host-app context) ships multiple layers. Lets a
   * dashboard admin pick "this delivery-tracking map should default to
   * satellite" without forcing the whole app onto a specific provider id.
   * `null` (or missing) = use the provider's first layer. B7-3.
   */
  readonly defaultLayerKind?: MapTileLayerKind | null;
}
