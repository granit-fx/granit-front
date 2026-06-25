import type { MapWidgetDefinition } from '@granit/analytics';
import type { WidgetCatalogEntry } from '@granit/react-dashboard-editor';

/**
 * Catalog entry for the `'map'` widget kind. Compose into the editor's
 * palette via:
 *
 *     <WidgetPalette
 *       catalog={composeCatalogs(defaultWidgetCatalog, mapWidgetCatalog)}
 *       ... />
 *
 * Default size matches the `MEDIA_TILE` proportions on a 12-column grid
 * (4×4) — large enough to show a meaningful map with markers without
 * dominating the dashboard. Apps that want a wider map override
 * `defaultSize` by composing their own catalog entry with the same type.
 *
 * The factory produces a minimal-but-valid widget bound to a
 * `lat-lng` point source with empty column names — the user fills the
 * column names + `queryName` via {@link MapConfigForm}. Until configured,
 * the map renders empty (no rows from an unbound query); the framework
 * treats unbound queries as "no data", not an error.
 */
export const mapWidgetCatalog: readonly WidgetCatalogEntry[] = Object.freeze([
  {
    type: 'map',
    labelLocalizationKey: 'Dashboard:Widget.Map.Label',
    iconKey: 'map',
    defaultSize: { width: 6, height: 4 },
    minSize: { width: 3, height: 3 },
    createDefaultWidget: (slug, position): MapWidgetDefinition => ({
      slug,
      type: 'map',
      position,
      size: { width: 6, height: 4 },
      queryName: '',
      pointSource: { kind: 'lat-lng', latitudeColumn: '', longitudeColumn: '' },
      popupColumns: null,
      defaultZoom: 5,
      defaultCenter: null,
      clusterThreshold: 200,
      detailRoute: null,
      tileUrlTemplate: null,
      defaultLayerKind: null,
    }),
  },
]);
