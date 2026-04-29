// ---------------------------------------------------------------------------
// @granit/react-analytics — public API
// ---------------------------------------------------------------------------

// Hook
export { normalizeMetricRequest, useMetric } from './api/use-metric.js';
export type { UseMetricOptions } from './api/use-metric.js';

// Widget renderers — definition-driven. `KpiTile` predates the
// per-widget render endpoint (P3) and uses the `useMetric` path which
// works against `POST /metrics/{name}` — kept stable for callers
// outside dashboards. Chart / Table / Pivot use the new
// `POST /widgets/{kind}/render` endpoints via `useWidgetRender` (P3),
// which keeps SSOT with the bundle path's snapshot widgets.
export { KpiTile } from './components/kpi-tile.js';
export type { KpiTileProps } from './components/kpi-tile.js';
export { KpiTileView } from './components/kpi-tile-view.js';
export type { KpiTileViewProps } from './components/kpi-tile-view.js';
export { ChartTile } from './components/chart-tile.js';
export type { ChartTileProps } from './components/chart-tile.js';
export { TableTile } from './components/table-tile.js';
export type { TableTileProps } from './components/table-tile.js';
export { PivotTile } from './components/pivot-tile.js';
export type { PivotTileProps } from './components/pivot-tile.js';

// Snapshot renderers (B5 — bundle-driven, consume the pre-rendered envelope)
export { KpiSnapshotTile } from './components/kpi-snapshot-tile.js';
export { PivotSnapshotWidget } from './components/pivot-snapshot-widget.js';
export { TableSnapshotWidget } from './components/table-snapshot-widget.js';

// Registries
export { defaultAnalyticsWidgetRegistry } from './registry/default-analytics-widget-registry.js';
export { defaultAnalyticsSnapshotWidgetRegistry } from './registry/default-analytics-snapshot-widget-registry.js';

// Formatters (re-exported for convenience — also available standalone)
export { formatDeltaRatio, formatMetricValue } from './lib/format-metric-value.js';
export type { FormatMetricValueArgs } from './lib/format-metric-value.js';
