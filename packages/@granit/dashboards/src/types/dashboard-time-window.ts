/**
 * Time window applied to every data-bound widget on a dashboard. Mirrors the
 * proposed `Granit.Dashboards.DashboardTimeWindow` (proposals doc P1.3).
 *
 * The frontend surfaces it as a top-of-dashboard control ("Last 30 days ▾");
 * user changes propagate to all widgets that don't carry their own override.
 *
 * Period shape is intentionally structurally compatible with
 * `@granit/analytics`'s `PeriodSpec` (token-based or absolute range) without
 * a hard type-level dependency — keeps the dashboards package free of
 * analytics concerns at the type system level.
 */
export interface DashboardTimeWindow {
  readonly period: DashboardPeriod;
  /** Refresh semantics: `history` (frozen, refetch on range change) vs `realtime` (sliding window). */
  readonly kind?: TimeWindowKind;
  /** Optional comparison window (e.g. `previous_period`). */
  readonly compareTo?: { readonly token: string };
  /**
   * Bucket size for time-series aggregation, in milliseconds. When omitted,
   * the widget's data source picks a default.
   */
  readonly aggregationMs?: number;
}

export type TimeWindowKind = 'history' | 'realtime';

/**
 * Period selector — token-based (`last_30d`, `mtd`, `ytd`, `last_5m`, ...) or
 * an absolute ISO 8601 range. Token strings stay open so backend additions
 * don't require a frontend type bump.
 */
export type DashboardPeriod =
  | { readonly token: string }
  | { readonly from: string; readonly to: string };

/** Convenience constants matching the conventional tokens. */
export const DASHBOARD_TIME_WINDOW = Object.freeze({
  Last24Hours: { period: { token: 'last_24h' }, kind: 'history' } satisfies DashboardTimeWindow,
  Last7Days: { period: { token: 'last_7d' }, kind: 'history' } satisfies DashboardTimeWindow,
  Last30Days: { period: { token: 'last_30d' }, kind: 'history' } satisfies DashboardTimeWindow,
  Mtd: { period: { token: 'mtd' }, kind: 'history' } satisfies DashboardTimeWindow,
  Ytd: { period: { token: 'ytd' }, kind: 'history' } satisfies DashboardTimeWindow,
  RealtimeLast5Minutes: {
    period: { token: 'last_5m' },
    kind: 'realtime',
  } satisfies DashboardTimeWindow,
});
