import { isMapSnapshotEnvelope } from '@granit/analytics';
import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';

import { useMapTileProvider } from '../components/map-tile-provider-context.js';

import 'leaflet/dist/leaflet.css';

import type { MapTileLayer } from '../types.js';
import type { MapWidgetSnapshot } from '@granit/analytics';
import type { DashboardRenderedWidget } from '@granit/dashboards';

// Leaflet's default marker icons rely on relative paths that bundlers strip.
// Pin them to the CDN so apps don't need to import PNG assets manually.
// Apps that prefer self-hosted icons override `L.Icon.Default.mergeOptions`
// at the entry point.
const LEAFLET_ICON_CDN = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images';
L.Icon.Default.mergeOptions({
  iconUrl: `${LEAFLET_ICON_CDN}/marker-icon.png`,
  iconRetinaUrl: `${LEAFLET_ICON_CDN}/marker-icon-2x.png`,
  shadowUrl: `${LEAFLET_ICON_CDN}/marker-shadow.png`,
});

/**
 * Snapshot-driven renderer for the `'Map'` widget kind. Vanilla Leaflet
 * wrapper — no react-leaflet dep, since its current Hippocratic License is
 * incompatible with Apache-2.0-strict consumer policies.
 *
 * Tile resolution priority (highest first):
 * 1. `widget.snapshot.tileUrlTemplate` — escape hatch for one-off widgets
 *    that need a specific URL (white-label, ad-hoc historical layer).
 *    Renders as a single static layer, no layer-switcher.
 * 2. Active {@link MapTileProvider} from {@link MapTileProviderContext}.
 *    When the provider exposes >1 layer (e.g. SPW: plan / satellite /
 *    hybride), Leaflet's built-in `L.Control.Layers` switcher mounts on
 *    the top-right corner.
 * 3. {@link osmProvider} — silent default when no provider context is
 *    mounted.
 *
 * Marker click-through: when both `snapshot.detailRoute` and `point.id`
 * are set, the marker handler navigates via `window.location.href`. Apps
 * wanting React Router integration register their own snapshot renderer
 * with `useNavigate()` from `react-router-dom`.
 */
export function MapSnapshotWidget({ widget }: { readonly widget: DashboardRenderedWidget }) {
  if (!isMapSnapshotEnvelope(widget) || !widget.snapshot) return null;
  return <MapBody snapshot={widget.snapshot} />;
}

function MapBody({ snapshot }: { readonly snapshot: MapWidgetSnapshot }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const provider = useMapTileProvider();

  // Effective layers: the snapshot's tileUrlTemplate (when set) wins as a
  // single override; otherwise we expose every provider layer to the layer
  // switcher.
  const layers = useMemo<readonly MapTileLayer[]>(() => {
    if (snapshot.tileUrlTemplate) {
      return [
        {
          id: 'snapshot-override',
          kind: 'Custom',
          url: snapshot.tileUrlTemplate,
          // Per-widget overrides: the host already controls attribution
          // visibility (it owns the URL choice), but we keep a non-empty
          // default so Leaflet doesn't suppress its built-in attribution
          // control entirely.
          attribution: '&copy; tile provider',
        },
      ];
    }
    return provider.layers;
  }, [snapshot.tileUrlTemplate, provider]);

  // Initialise the map exactly once. Subsequent updates run through dedicated
  // effects so we don't tear down + rebuild Leaflet on every snapshot prop
  // change (would lose user pan/zoom state).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { attributionControl: true });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Mount tile layers + (optional) Layers control. Re-runs when the
  // resolved layer set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const tileLayerById = new Map<string, L.TileLayer>();
    for (const layer of layers) {
      tileLayerById.set(
        layer.id,
        L.tileLayer(layer.url, {
          attribution: layer.attribution,
          subdomains: (layer.subdomains as string | string[] | undefined) ?? 'abc',
          maxZoom: layer.maxZoom ?? 19,
          minZoom: layer.minZoom ?? 0,
          tileSize: layer.tileSize ?? 256,
        })
      );
    }

    // Default layer resolution (B7-3): when the snapshot ships a
    // `defaultLayerKind` preference, prefer the matching provider layer;
    // otherwise fall back to the first layer. The escape-hatch single-
    // layer override (snapshot.tileUrlTemplate) is already collapsed to
    // a one-element `layers` array upstream — `find` matches its
    // synthetic `kind: 'Custom'` only when the snapshot also asks for
    // 'Custom', which is intentional.
    const preferredLayer =
      (snapshot.defaultLayerKind != null
        ? layers.find((layer) => layer.kind === snapshot.defaultLayerKind)
        : undefined) ?? layers[0];
    const defaultTile = preferredLayer ? tileLayerById.get(preferredLayer.id) : undefined;
    defaultTile?.addTo(map);

    // Mount the layer-switcher only when more than one layer is offered.
    let layersControl: L.Control.Layers | null = null;
    if (layers.length > 1) {
      const baseLayers: Record<string, L.TileLayer> = {};
      for (const layer of layers) {
        const tile = tileLayerById.get(layer.id);
        if (tile) {
          // The layer-switcher label is the localization key — apps whose
          // bundle resolves it format the label downstream. The default
          // surfaces the key verbatim, which is acceptable for dev mode.
          const label = layer.labelLocalizationKey ?? layer.id;
          baseLayers[label] = tile;
        }
      }
      layersControl = L.control.layers(baseLayers, undefined, { position: 'topright' });
      layersControl.addTo(map);
    }

    return () => {
      layersControl?.remove();
      for (const tile of tileLayerById.values()) {
        tile.remove();
      }
    };
  }, [layers, snapshot.defaultLayerKind]);

  // Camera (zoom + center). Falls back to bounding-box fit when no center
  // is supplied; falls back to world view when there are zero points.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (snapshot.defaultCenter) {
      map.setView(
        [snapshot.defaultCenter.latitude, snapshot.defaultCenter.longitude],
        snapshot.defaultZoom
      );
      return;
    }
    if (snapshot.points.length > 0) {
      const bounds = L.latLngBounds(
        snapshot.points.map((p) => [p.latitude, p.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [16, 16] });
      return;
    }
    map.setView([0, 0], 2);
  }, [snapshot.defaultCenter, snapshot.defaultZoom, snapshot.points]);

  // Markers + (optional) clustering. Rebuilt on every points / threshold /
  // detailRoute change so click handlers stay current.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Plain layer group by default; apps that ship leaflet.markercluster
    // get clustering above the threshold via dynamic require — the dep
    // is declared as an OPTIONAL peer so the framework default keeps
    // working without it.
    const layer = L.layerGroup();
    const useCluster = snapshot.points.length > snapshot.clusterThreshold;
    let clusterGroup: L.LayerGroup | null = null;

    type ClusterFactory = () => L.LayerGroup;
    type ClusterModule = { default?: ClusterFactory } | { markerClusterGroup?: ClusterFactory };
    const lWithCluster = L as unknown as { markerClusterGroup?: ClusterFactory };
    if (useCluster && typeof lWithCluster.markerClusterGroup === 'function') {
      clusterGroup = lWithCluster.markerClusterGroup();
    } else if (useCluster) {
      // leaflet.markercluster augments the L namespace at import time.
      // When the optional peer isn't installed the cluster threshold
      // becomes a soft hint — markers render unclustered.
      void (null as unknown as ClusterModule);
    }

    for (const point of snapshot.points) {
      const marker = L.marker([point.latitude, point.longitude]);
      if (point.popup) {
        const popupHtml = Object.entries(point.popup)
          .map(([k, v]) => `<strong>${escapeHtml(k)}</strong>: ${escapeHtml(String(v))}`)
          .join('<br/>');
        marker.bindPopup(popupHtml);
      }
      if (snapshot.detailRoute && point.id) {
        const route = snapshot.detailRoute.replace('{id}', encodeURIComponent(point.id));
        marker.on('click', () => {
          // Apps wanting React Router integration override this snapshot
          // renderer with `useNavigate()` instead of `window.location.href`.
          window.location.href = route;
        });
        marker.options.alt = route;
      }
      (clusterGroup ?? layer).addLayer(marker);
    }

    const target = clusterGroup ?? layer;
    target.addTo(map);

    return () => {
      target.remove();
    };
  }, [snapshot.points, snapshot.clusterThreshold, snapshot.detailRoute]);

  return (
    <div
      ref={containerRef}
      data-slot="map-snapshot-widget"
      data-tile-provider={snapshot.tileUrlTemplate ? 'snapshot-override' : provider.id}
      className="h-full w-full min-h-64"
    />
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
