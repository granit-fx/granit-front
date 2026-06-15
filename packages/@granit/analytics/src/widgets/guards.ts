// ---------------------------------------------------------------------------
// @granit/analytics — runtime type guards. The DTO contracts they refine live
// in ../types; these stay here as the package's runtime surface.
// ---------------------------------------------------------------------------

import type {
  ChartSnapshotEnvelope,
  GeographyMapPointSource,
  KpiSnapshotEnvelope,
  LatLngMapPointSource,
  MapPointSource,
  MapSnapshotEnvelope,
  PivotSnapshotEnvelope,
  TableSnapshotEnvelope,
} from '../types';
import type { WidgetSnapshotEnvelope } from '@granit/dashboards';

/** Type guard refining a generic envelope to {@link ChartSnapshotEnvelope}. */
export function isChartSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is ChartSnapshotEnvelope {
  return envelope.widgetType === 'Chart';
}

/**
 * Type guard refining a generic {@link WidgetSnapshotEnvelope} to the
 * KPI-specific {@link KpiSnapshotEnvelope}. Drives renderer dispatch in the
 * frontend `useDashboard` hook (and in any consumer that walks the bundle
 * response widget by widget).
 */
export function isKpiSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is KpiSnapshotEnvelope {
  return envelope.widgetType === 'Kpi';
}

/** Type guard refining a generic envelope to {@link MapSnapshotEnvelope}. */
export function isMapSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is MapSnapshotEnvelope {
  return envelope.widgetType === 'Map';
}

/** Type guard refining a generic envelope to {@link PivotSnapshotEnvelope}. */
export function isPivotSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is PivotSnapshotEnvelope {
  return envelope.widgetType === 'Pivot';
}

/** Type guard refining a generic envelope to {@link TableSnapshotEnvelope}. */
export function isTableSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is TableSnapshotEnvelope {
  return envelope.widgetType === 'Table';
}

/** Narrows a {@link MapPointSource} to the lat/lng flavour. */
export function isLatLngMapPointSource(source: MapPointSource): source is LatLngMapPointSource {
  return source.kind === 'lat-lng';
}

/** Narrows a {@link MapPointSource} to the PostGIS geography flavour. */
export function isGeographyMapPointSource(
  source: MapPointSource
): source is GeographyMapPointSource {
  return source.kind === 'geography';
}
