// ---------------------------------------------------------------------------
// @granit/react-analytics — public API
// ---------------------------------------------------------------------------

// Hook
export { normalizeMetricRequest, useMetric } from './api/use-metric.js';
export type { UseMetricOptions } from './api/use-metric.js';

// Widget renderers — definition-driven (KpiTile fetches its own metric data)
export { KpiTile } from './components/kpi-tile.js';
export type { KpiTileProps } from './components/kpi-tile.js';
export { KpiTileView } from './components/kpi-tile-view.js';
export type { KpiTileViewProps } from './components/kpi-tile-view.js';

// Snapshot renderer (B5 — bundle-driven, consumes the pre-rendered envelope)
export { KpiSnapshotTile } from './components/kpi-snapshot-tile.js';

// Registries
export { defaultAnalyticsWidgetRegistry } from './registry/default-analytics-widget-registry.js';
export { defaultAnalyticsSnapshotWidgetRegistry } from './registry/default-analytics-snapshot-widget-registry.js';

// Formatters (re-exported for convenience — also available standalone)
export { formatDeltaRatio, formatMetricValue } from './lib/format-metric-value.js';
export type { FormatMetricValueArgs } from './lib/format-metric-value.js';
