/**
 * Pull / push transport hint shipped on every widget envelope. Drives how
 * `useDashboard` (and its single-widget cousin `useMetric`) cadence their
 * background refetch:
 *
 * - `Static`  — the snapshot is computed offline; never refetch.
 * - `Dynamic` — refetch on demand, no polling. The default for KPI / chart
 *   tiles bound to dashboard time windows.
 * - `Realtime` — short polling (~5s) until the future SSE / WS push
 *   transport (P2.4) replaces it.
 *
 * Lives in `@granit/dashboards` rather than `@granit/analytics` so the
 * widget-renderer envelope can carry it without forcing the dashboards
 * package to depend on analytics — mirrors backend's
 * `Granit.Analytics.Metrics.RefreshHint` promotion to
 * `Granit.Analytics.Abstractions` per ADR-039.
 *
 * PascalCase wire values — backend's host registers a
 * `JsonStringEnumConverter()` with no naming policy.
 */
export type RefreshHint = 'Static' | 'Dynamic' | 'Realtime';
