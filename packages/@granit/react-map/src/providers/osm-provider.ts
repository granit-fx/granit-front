import type { MapTileProvider } from '../types.js';

/**
 * OpenStreetMap default raster tiles. Free, world coverage, no API key.
 * Attribution under CC-BY-SA — **mandatory** in the widget chrome per the
 * OSMF tile-usage policy.
 *
 * Single layer (`'plan'`) — OSM doesn't ship aerial imagery on the public
 * tile service. Apps that want satellite layers configure another provider
 * (SPW, ArcGIS, MapTiler, …).
 */
export const osmProvider: MapTileProvider = {
  id: 'osm',
  labelLocalizationKey: 'Map:Provider.OSM',
  layers: [
    {
      id: 'osm-standard',
      labelLocalizationKey: 'Map:Layer.Plan',
      kind: 'plan',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
    },
  ],
};
