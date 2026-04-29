import type { MapTileProvider } from '../types.js';

/**
 * Walloon Public Service geoportal — official tile services for the Walloon
 * region (Belgium). Used by Belgian public-sector deployments.
 *
 * Service catalogue: https://geoportail.wallonie.be/catalogue
 *
 * Three layers exposed by default:
 * - **PLAN_PARCELLAIRE** (`'plan'`) — cadastral / parcel map.
 * - **ORTHO** (`'satellite'`) — aerial ortho-imagery (latest available year).
 * - **HYBRIDE** (`'hybrid'`) — ortho-imagery + label overlay.
 *
 * Attribution under the Walloon open-data licence — **mandatory** in the
 * widget chrome. URLs follow the Esri `{z}/{y}/{x}` tile order; the
 * widget passes them verbatim to Leaflet's `L.tileLayer` which handles
 * both XYZ orderings transparently.
 *
 * The exact REST service URLs are stable but not contractually frozen —
 * apps that need a specific historical ortho year (e.g. ORTHO_2024 vs
 * ORTHO_2022) should compose their own provider rather than rely on
 * the generic latest-ortho URL here.
 */
export const spwProvider: MapTileProvider = {
  id: 'spw',
  labelLocalizationKey: 'Map:Provider.SPW',
  layers: [
    {
      id: 'spw-plan-parcellaire',
      labelLocalizationKey: 'Map:Layer.Plan',
      kind: 'Plan',
      url: 'https://geoservices.wallonie.be/arcgis/rest/services/PLAN_REGLEMENTAIRE/PLAN_PARCELLAIRE/MapServer/tile/{z}/{y}/{x}',
      attribution:
        '&copy; <a href="https://geoportail.wallonie.be">SPW — Service Public de Wallonie</a>',
      maxZoom: 19,
    },
    {
      id: 'spw-ortho',
      labelLocalizationKey: 'Map:Layer.Satellite',
      kind: 'Satellite',
      url: 'https://geoservices.wallonie.be/arcgis/rest/services/IMAGERIE/ORTHO_LAST/MapServer/tile/{z}/{y}/{x}',
      attribution:
        '&copy; <a href="https://geoportail.wallonie.be">SPW — Service Public de Wallonie</a>',
      maxZoom: 19,
    },
    {
      id: 'spw-hybride',
      labelLocalizationKey: 'Map:Layer.Hybrid',
      kind: 'Hybrid',
      url: 'https://geoservices.wallonie.be/arcgis/rest/services/IMAGERIE/ORTHO_LAST_HYBRIDE/MapServer/tile/{z}/{y}/{x}',
      attribution:
        '&copy; <a href="https://geoportail.wallonie.be">SPW — Service Public de Wallonie</a>',
      maxZoom: 19,
    },
  ],
};
