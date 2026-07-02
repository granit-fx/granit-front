// ---------------------------------------------------------------------------
// @granit/react-analytics — public API
// ---------------------------------------------------------------------------

// Hooks
export { useMetric } from './hooks/use-metric';
export type { UseMetricOptions } from './hooks/use-metric';
export { useMetricCatalog } from './hooks/use-metric-catalog';
export type { UseMetricCatalogOptions } from './hooks/use-metric-catalog';
// Headless query-field metadata — resolves the query catalogue + selected-query
// column metadata into the option lists the (react-ui) config forms render.
export { useQueryFieldMetadata } from './editor/use-query-field-metadata';
export type { FieldOption, QueryFieldMetadata } from './editor/use-query-field-metadata';

// Widget renderers — definition-driven. `KpiTile` predates the
// per-widget render endpoint (P3) and uses the `useMetric` path which
// works against `POST /metrics/{name}` — kept stable for callers
// outside dashboards. Chart / Table / Pivot use the new
// `POST /analytics/widgets/{kind}/render` endpoints via `useWidgetRender` (P3),
// which keeps SSOT with the bundle path's snapshot widgets.
export { KpiTile } from './components/kpi-tile';
export type { KpiTileProps } from './components/kpi-tile';
export { KpiTileView } from './components/kpi-tile-view';
export type { KpiTileViewProps } from './components/kpi-tile-view';
export { ChartTile } from './components/chart-tile';
export type { ChartTileProps } from './components/chart-tile';
export { TableTile } from './components/table-tile';
export type { TableTileProps } from './components/table-tile';
export { PivotTile } from './components/pivot-tile';
export type { PivotTileProps } from './components/pivot-tile';

// Snapshot renderers (B5 — bundle-driven, consume the pre-rendered envelope)
export { KpiSnapshotTile } from './components/kpi-snapshot-tile';
export { PivotSnapshotWidget } from './components/pivot-snapshot-widget';
export { TableSnapshotWidget } from './components/table-snapshot-widget';

// Registries
export { defaultAnalyticsWidgetRegistry } from './registry/default-analytics-widget-registry';
export { defaultAnalyticsSnapshotWidgetRegistry } from './registry/default-analytics-snapshot-widget-registry';

// Formatters (re-exported for convenience — also available standalone)
export { formatDeltaRatio, formatMetricValue } from './lib/format-metric-value';
export type { FormatMetricValueArgs } from './lib/format-metric-value';
