# @granit/react-ui-map

React **map widget** primitives for Granit dashboards — a vanilla Leaflet wrapper
(no `react-leaflet` dependency) that renders the `Map` dashboard widget kind with
multi-provider tile support: OpenStreetMap (default), the SPW Walloon geoportal,
Esri ArcGIS, and app-defined custom providers. It plugs the `Map` kind into the
dashboard snapshot/definition renderer registries and contributes a config form +
catalog entry to the dashboard composer.

This is the **React rendering layer** for maps. It owns no wire format: the
`MapWidgetSnapshot` / `MapWidgetDefinition` / `MapTileLayerKind` types and the
point-source guards (`isLatLngMapPointSource`, `isGeographyMapPointSource`,
`isMapSnapshotEnvelope`) live in the framework-agnostic
[`@granit/analytics`](../analytics) core, mirroring the .NET `Granit.Analytics`
backend (contract: `contracts/openapi/analytics.json`, render route
`POST /analytics/widgets/map/render`). The package layers onto the dashboard
runtime in [`@granit/react-dashboards`](../react-dashboards) and the composer in
[`@granit/react-dashboard-editor`](../react-dashboard-editor); there is no
`@granit/map` core sibling and no `react-ui-map` admin kit — the tile-provider
context, providers, and registries shipped here _are_ the public surface.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/analytics` — `MapWidgetSnapshot` / `MapWidgetDefinition` /
  `MapTileLayerKind` wire types and the point-source / envelope guards.
- `@granit/dashboards` — `DashboardRenderedWidget` consumed by the snapshot
  renderer.
- `@granit/react-dashboards` — the `SnapshotWidgetRegistry` / `WidgetRegistry`
  types and `useWidgetRender` / `RenderedWidget` host plumbing.
- `@granit/csp` — `installNamedPolicy` for the `granit-map` Trusted Types policy
  (`@granit/react-ui-map/csp` subpath).
- `@granit/utils` — `assertSafeUrl`, used to reject `javascript:` / protocol-
  relative marker `detailRoute` templates.
- `leaflet` (`^1.9.4`) and `react` (`^19`).
- `@granit/react-dashboard-editor` (**optional**) — only for the
  `@granit/react-ui-map/editor` composer subpath (catalog + config form).
- `leaflet.markercluster` (`^1.5.3`, **optional**) — enables marker clustering
  above the snapshot's `clusterThreshold`; absent, the threshold is a soft hint
  and markers render unclustered.
- `dompurify` (`^3`, **optional**) — sanitizer behind the `granit-map` Trusted
  Types policy; loaded lazily on first `createHTML`.
- `react-i18next` (`^17`, **optional**) — only for the `editor` config form's
  `useTranslation` labels.

## Quick start

Select the active tile provider once at the dashboard root, then register the map
renderer alongside the framework default and analytics registries. Apps that never
ship a `Map` widget simply don't import this package and pay zero Leaflet weight.

```tsx
import {
  MapTileProviderProvider,
  defaultMapSnapshotWidgetRegistry,
  spwProvider,
} from '@granit/react-ui-map';
import {
  RenderedDashboard,
  SnapshotWidgetRegistryProvider,
  defaultSnapshotWidgetRegistry,
} from '@granit/react-dashboards';
import { defaultAnalyticsSnapshotWidgetRegistry } from '@granit/react-analytics';

function Dashboard({ dashboardId }: { dashboardId: string }) {
  // Belgian public-sector deployment — SPW plan / ortho / hybride layers.
  return (
    <MapTileProviderProvider provider={spwProvider}>
      <SnapshotWidgetRegistryProvider
        registries={[
          defaultSnapshotWidgetRegistry, // Markdown / Text / Image
          defaultAnalyticsSnapshotWidgetRegistry, // Kpi / Chart / Table / Pivot
          defaultMapSnapshotWidgetRegistry, // Map (this package)
        ]}
      >
        <RenderedDashboard dashboardId={dashboardId} />
      </SnapshotWidgetRegistryProvider>
    </MapTileProviderProvider>
  );
}
```

When the active provider exposes more than one layer, `<MapSnapshotWidget>` mounts
Leaflet's built-in `L.Control.Layers` switcher (top-right). A per-widget
`snapshot.tileUrlTemplate` overrides the provider as a single static layer. The
provider falls back to `osmProvider` when no `MapTileProviderProvider` is mounted —
the widget never crashes on a missing provider.

For the definition path (composer / catalogue preview), register the renderer that
fetches `POST /analytics/widgets/map/render` instead:

```tsx
import { defaultMapWidgetRegistry } from '@granit/react-ui-map';
import { WidgetRegistryProvider, defaultWidgetRegistry } from '@granit/react-dashboards';
import { defaultAnalyticsWidgetRegistry } from '@granit/react-analytics';

<WidgetRegistryProvider
  registries={[defaultWidgetRegistry, defaultAnalyticsWidgetRegistry, defaultMapWidgetRegistry]}
/>;
```

The `@granit/react-ui-map/editor` subpath contributes the composer surface —
`mapWidgetCatalog` (palette entry, default 6×4 size), `MapConfigForm`, and the
pre-composed `mapWidgetConfigFormRegistry` — keyed by the `'map'` widget type.

## Public API

| Symbol                             | Kind      | Purpose                                                     |
| ---------------------------------- | --------- | ----------------------------------------------------------- |
| `MapSnapshotWidget`                | component | Vanilla-Leaflet renderer for the `Map` snapshot widget kind |
| `defaultMapSnapshotWidgetRegistry` | const     | Frozen `{ Map: MapSnapshotWidget }` snapshot registry       |
| `MapTile`                          | component | Definition-path renderer (`POST .../widgets/map/render`)    |
| `MapTileProps`                     | type      | `{ widget: MapWidgetDefinition; context? }` for `MapTile`   |
| `defaultMapWidgetRegistry`         | const     | Frozen `{ map: MapTile }` definition-path registry          |
| `MapTileProviderProvider`          | provider  | Supplies the active tile provider to the dashboard subtree  |
| `useMapTileProvider`               | hook      | Read the active provider; falls back to `osmProvider`       |
| `MapTileProviderProviderProps`     | type      | `{ provider, children }`                                    |
| `osmProvider`                      | const     | OpenStreetMap raster tiles (single `Plan` layer, CC-BY-SA)  |
| `spwProvider`                      | const     | SPW Walloon geoportal (plan / ortho / hybride layers)       |
| `arcGisProvider`                   | const     | Esri ArcGIS basemaps (street / imagery / topo layers)       |
| `MapTileProvider`                  | type      | A provider: `{ id, labelLocalizationKey?, layers }`         |
| `MapTileLayer`                     | type      | One layer (url, attribution, zoom, subdomains, tileSize)    |
| `MapTileLayerKind`                 | type      | Re-export of the `@granit/analytics` layer-kind union       |

`@granit/react-ui-map/editor` subpath (requires the optional
`@granit/react-dashboard-editor` peer): `mapWidgetCatalog` (palette `WidgetCatalogEntry`),
`MapConfigForm` (`WidgetConfigForm` for `MapWidgetDefinition`), and
`mapWidgetConfigFormRegistry` (frozen `{ map: MapConfigForm }`).

`@granit/react-ui-map/csp` subpath: `installPolicy()` (idempotent, SSR-safe, no-op
without Trusted Types) registering the `granit-map` policy, plus the
`GRANIT_MAP_POLICY_NAME` constant.

## Security / CSP

`<MapSnapshotWidget>` writes marker popup bodies through Leaflet's
`bindPopup(htmlString)`, which sets `innerHTML` under the hood. Under a CSP with
`require-trusted-types-for 'script'`, those writes need a `TrustedHTML` —
the package therefore exposes a `granit-map` Trusted Types policy and **must** be
listed in the directive:

```text
trusted-types granit granit-map;
require-trusted-types-for 'script';
```

Defense in depth runs at two layers: popup key/value pairs are pre-escaped via an
inline `escapeHtml()` before they reach Leaflet, and the `granit-map` policy
re-sanitizes through DOMPurify (lazy-loaded) on `createHTML`. Marker
`detailRoute` templates are server-defined widget config and are validated with
`assertSafeUrl` from `@granit/utils` before navigation, rejecting `javascript:`
and protocol-relative URLs. Per the framework's CSP arch-test (`pnpm check:csp`),
any `@granit/*` package writing to a DOM script sink must expose this `/csp`
subpath with an idempotent `installPolicy()`.

Marker click navigation defaults to `globalThis.location.href`. Apps wanting React
Router integration register their own snapshot renderer that uses `useNavigate()`
instead of importing `MapSnapshotWidget` directly.

## Out of scope / caveats

- **No `react-leaflet` dependency.** Its current Hippocratic License is
  incompatible with the framework's Apache-2.0-strict consumer policy, so the
  package drives `L.map` / `L.tileLayer` / `L.marker` directly.
- **Tile-provider attribution is mandatory.** OSM (CC-BY-SA), SPW (Walloon
  open-data licence), and ArcGIS (Esri Master Agreement) tiles ship non-empty
  `attribution`; Leaflet's attribution control is always mounted. Only custom
  self-hosted layers may pass `''` when attribution is displayed elsewhere.
- **Wire format and HTTP belong to `@granit/analytics`.** This package mirrors no
  DTOs and issues no Axios calls of its own; `MapTile` delegates rendering to
  `useWidgetRender` in `@granit/react-dashboards`.
- **Leaflet marker icons** are pinned to the jsDelivr CDN (bundlers strip
  Leaflet's relative icon paths). Apps preferring self-hosted icons override
  `L.Icon.Default.mergeOptions` at their entry point.
- **`spwProvider` ortho URLs track the latest available year.** Apps needing a
  specific historical ortho (e.g. `ORTHO_2022`) should compose their own provider
  rather than rely on the generic latest-ortho URL.
- **Marker clustering is opt-in.** Install the optional `leaflet.markercluster`
  peer to activate it above `clusterThreshold`; without it the threshold is a soft
  hint and all markers render unclustered.

## License

Apache-2.0
