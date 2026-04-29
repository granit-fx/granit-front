import { MapSnapshotWidget } from './map-snapshot-widget.js';

import type { SnapshotWidgetRegistry } from '@granit/react-dashboards';

/**
 * Snapshot renderer registry contributed by `@granit/react-map`. Compose
 * with the framework default + analytics registries at the app root:
 *
 *     <MapTileProviderProvider provider={spwProvider}>
 *       <SnapshotWidgetRegistryProvider registries={[
 *         defaultSnapshotWidgetRegistry,             // Markdown / Text / Image
 *         defaultAnalyticsSnapshotWidgetRegistry,    // Kpi / Chart / Table / Pivot
 *         defaultMapSnapshotWidgetRegistry,          // Map (this package)
 *       ]}>
 *
 * Apps that don't ship `Map` widgets don't import this and pay zero
 * Leaflet bundle weight.
 */
export const defaultMapSnapshotWidgetRegistry: SnapshotWidgetRegistry = Object.freeze({
  Map: MapSnapshotWidget,
});
