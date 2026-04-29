import { KpiSnapshotTile } from '../components/kpi-snapshot-tile.js';
import { PivotSnapshotWidget } from '../components/pivot-snapshot-widget.js';
import { TableSnapshotWidget } from '../components/table-snapshot-widget.js';

import type { SnapshotWidgetRegistry } from '@granit/react-dashboards';

/**
 * Snapshot-driven analytics renderers, keyed by their PascalCase
 * `widgetType` discriminator. Compose with the framework default snapshot
 * registry at the app root so `<RenderedDashboard>` resolves analytics
 * widgets without per-app re-registration:
 *
 *     <SnapshotWidgetRegistryProvider registries={[
 *       defaultSnapshotWidgetRegistry,             // Markdown / Text / Image
 *       defaultAnalyticsSnapshotWidgetRegistry,    // Kpi (+ Chart / Table / Pivot / Map as they ship)
 *       appCustomSnapshotRegistry,
 *     ]}>
 *
 * v1 ships `Kpi` only. `Chart` / `Table` / `Pivot` / `Map` renderers land as
 * the per-kind UI components are productionised (compact previews exist in
 * the showcase already; production-grade ECharts / Leaflet renderers come
 * with B5-B and dedicated chart-library wiring).
 */
export const defaultAnalyticsSnapshotWidgetRegistry: SnapshotWidgetRegistry = Object.freeze({
  Kpi: KpiSnapshotTile,
  Pivot: PivotSnapshotWidget,
  Table: TableSnapshotWidget,
});
