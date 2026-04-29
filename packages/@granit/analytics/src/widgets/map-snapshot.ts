import type { MapTileLayerKind } from './map-widget.js';
import type { WidgetSnapshotEnvelope, WidgetSnapshotEnvelopeOf } from '@granit/dashboards';

/**
 * Wire shape for {@link MapWidgetSnapshot.defaultCenter}. Mirrors
 * `Granit.Analytics.Endpoints.Rendering.MapCenterPayload`.
 */
export interface MapCenterPayload {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * One marker on the map. Mirrors
 * `Granit.Analytics.Endpoints.Rendering.MapPoint`.
 */
export interface MapPoint {
  /**
   * Entity primary key when the entity exposes a `Guid Id` property; `null`
   * otherwise. Drives the click-through to {@link MapWidgetSnapshot.detailRoute}.
   */
  readonly id: string | null;
  /** Latitude in decimal degrees. */
  readonly latitude: number;
  /** Longitude in decimal degrees. */
  readonly longitude: number;
  /**
   * Whitelisted column subset for the marker popup body. `null` when no
   * popup columns were configured on the widget.
   */
  readonly popup: Readonly<Record<string, unknown>> | null;
}

/**
 * Snapshot payload for the `'Map'` widget kind. Mirrors
 * `Granit.Analytics.Endpoints.Rendering.MapWidgetSnapshot` (B7-2, ADR-039).
 *
 * Carries the rendered markers plus the camera / clustering / detail-route
 * hints the frontend needs to bootstrap a Leaflet (or equivalent) map
 * without a second HTTP round-trip. Rows whose coordinates are out-of-range
 * or non-finite are silently dropped server-side (B7 acceptance — bad data
 * must not break the widget).
 */
export interface MapWidgetSnapshot {
  /**
   * Geocoded markers in stream-arrival order. Cap is bounded by the
   * `QueryDefinition`'s `MaxStreamSize` upstream.
   */
  readonly points: readonly MapPoint[];
  /** Initial zoom level (Leaflet scale: 0 world → 18 building). */
  readonly defaultZoom: number;
  /**
   * Initial map center; `null` means the frontend should fit the bounding
   * box of {@link points}.
   */
  readonly defaultCenter: MapCenterPayload | null;
  /** Marker count above which the frontend activates clustering. */
  readonly clusterThreshold: number;
  /**
   * Optional route template invoked on marker click (`{id}` substituted
   * with the row's primary key). `null` disables click-through.
   */
  readonly detailRoute: string | null;
  /**
   * Optional Leaflet tile-URL override; `null` falls back to the host's
   * default (typically OpenStreetMap).
   */
  readonly tileUrlTemplate: string | null;
  /**
   * Preferred layer kind echoed from the declarative
   * `MapWidgetDefinition.defaultLayerKind`. The frontend resolves it
   * against the active `MapTileProvider` layers (B7-3); `null` (or
   * missing on legacy snapshots that predate B7-3) = use the provider's
   * first layer.
   */
  readonly defaultLayerKind?: MapTileLayerKind | null;
}

/** Narrowed {@link WidgetSnapshotEnvelope} for the `'Map'` widget kind. */
export type MapSnapshotEnvelope = WidgetSnapshotEnvelopeOf<'Map', MapWidgetSnapshot>;

/** Type guard refining a generic envelope to {@link MapSnapshotEnvelope}. */
export function isMapSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is MapSnapshotEnvelope {
  return envelope.widgetType === 'Map';
}
