import type { MapTileProvider } from '../types.js';

/**
 * Esri ArcGIS Online World basemaps. Free for non-commercial use; commercial
 * deployments need an ArcGIS Online subscription. Attribution under the
 * Esri Master Agreement — **mandatory** in the widget chrome.
 *
 * Four standard layers shipped by default:
 * - **World_Topo_Map** (`'topo'`) — topographic basemap with relief.
 * - **World_Street_Map** (`'plan'`) — street map (default for `'plan'` kind).
 * - **World_Imagery** (`'satellite'`) — aerial / satellite imagery.
 * - **World_Imagery + Reference** (`'hybrid'`) — imagery with a reference
 *   label overlay layered on top via the Reference Overlay tile service.
 *
 * Apps wanting different Esri layers (e.g. `World_Dark_Gray_Base`,
 * `Ocean/World_Ocean_Base`) compose their own provider with the same shape.
 *
 * Tile URLs use the Esri `{z}/{y}/{x}` order (Leaflet's `L.tileLayer`
 * recognises this transparently — no URL transformation needed).
 */
export const arcGisProvider: MapTileProvider = {
  id: 'arcgis',
  labelLocalizationKey: 'Map:Provider.ArcGIS',
  layers: [
    {
      id: 'arcgis-world-street',
      labelLocalizationKey: 'Map:Layer.Plan',
      kind: 'Plan',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution:
        'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Sources: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, OpenStreetMap contributors',
      maxZoom: 19,
    },
    {
      id: 'arcgis-world-imagery',
      labelLocalizationKey: 'Map:Layer.Satellite',
      kind: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution:
        'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxZoom: 19,
    },
    {
      id: 'arcgis-world-topo',
      labelLocalizationKey: 'Map:Layer.Topo',
      kind: 'Topo',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution:
        'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, NRCan, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
      maxZoom: 19,
    },
  ],
};
