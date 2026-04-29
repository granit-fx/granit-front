/**
 * Map tile layer kind. Drives default ordering in the layer-switcher control
 * (plan first, then satellite, then hybrid composites). Frontend renderers
 * interpret the kind for grouping; the value carries no semantic meaning
 * beyond presentation.
 */
export type MapTileLayerKind =
  /** Standard road / street map (raster or vector tiles). */
  | 'plan'
  /** Aerial / satellite imagery without labels. */
  | 'satellite'
  /** Imagery + label overlay ("hybride" in French geoportals). */
  | 'hybrid'
  /** Topographic map with elevation contours. */
  | 'topo'
  /** Anything else — apps register their own kind for ad-hoc layers. */
  | 'custom';

/**
 * One tile layer offered by a {@link MapTileProvider}. Mirrors the inputs
 * Leaflet's `L.tileLayer(url, options)` accepts so the wrapper can hand
 * each field through with no transformation.
 */
export interface MapTileLayer {
  /** Stable identifier — drives the layer-switcher control's selection state. */
  readonly id: string;
  /**
   * Localization key (e.g. `'Map:Layer.Plan'`). Falls back to {@link id}
   * when the i18n bundle has no entry.
   */
  readonly labelLocalizationKey?: string;
  /** Layer kind — informs default ordering and the widget's data attributes. */
  readonly kind: MapTileLayerKind;
  /**
   * XYZ URL template (Leaflet syntax: `{s}` subdomain, `{z}`/`{x}`/`{y}`
   * tile coordinates). Esri tile services use a `{z}/{y}/{x}` order — pass
   * the URL verbatim, Leaflet recognises both.
   */
  readonly url: string;
  /**
   * HTML attribution. **Mandatory** for OSM (CC-BY-SA), SPW Wallonia (Wallonia
   * licence), ArcGIS (Esri licence) — never empty for hosted public tile
   * services. Custom self-hosted layers can ship `''` if attribution is
   * displayed elsewhere on the page.
   */
  readonly attribution: string;
  /**
   * Subdomain letters for the `{s}` placeholder (e.g. `['a', 'b', 'c']`).
   * Many providers ship 4 subdomains by convention to spread CDN load.
   */
  readonly subdomains?: readonly string[] | string;
  /** Maximum zoom level the provider supports. Default 19 (Leaflet default). */
  readonly maxZoom?: number;
  /** Minimum zoom level. Default 0 (world view). */
  readonly minZoom?: number;
  /**
   * Pixel size of one tile. Default 256 (raster XYZ standard). 512 is
   * common for retina-friendly vector / hi-DPI raster sets — paired with
   * `zoomOffset: -1` server-side.
   */
  readonly tileSize?: number;
}

/**
 * Tile provider registered into the {@link MapTileProviderContext}. Apps
 * select the active provider at the dashboard tree's root; \<MapSnapshotWidget\>
 * mounts the provider's first {@link layers} entry by default and surfaces
 * a Leaflet layer-switcher when more than one is declared.
 *
 * Built-in providers shipped by `@granit/react-map`:
 * - {@link osmProvider} — OpenStreetMap raster tiles (default).
 * - {@link spwProvider} — Wallonian geoportal (ortho + topo + hybride).
 * - {@link arcGisProvider} — Esri World basemaps (Topo / Imagery / Streets / Hybrid).
 *
 * Apps register custom providers (MapTiler, Stadia, white-label) via the
 * same shape and pass them to {@link MapTileProviderProvider}.
 */
export interface MapTileProvider {
  /** Stable identifier (e.g. `'osm'` / `'spw'` / `'arcgis'`). */
  readonly id: string;
  /**
   * Localization key (e.g. `'Map:Provider.SPW'`). Falls back to {@link id}
   * when the i18n bundle has no entry.
   */
  readonly labelLocalizationKey?: string;
  /**
   * Layers offered by this provider, in display order. The first entry is
   * the **default** active layer. Tuple type guarantees at least one
   * layer at the type level.
   */
  readonly layers: readonly MapTileLayer[];
}
