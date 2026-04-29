/**
 * Time window applied to every data-bound widget on a dashboard. Mirrors
 * `Granit.Dashboards.DashboardTimeWindow` (P1.3).
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
  /** Refresh semantics: `History` (frozen, refetch on range change) vs `Realtime` (sliding window). */
  readonly kind?: TimeWindowKind;
  /** Optional comparison window (e.g. `previous_period`). */
  readonly compareTo?: { readonly token: string };
  /**
   * Bucket size for time-series aggregation, serialized as
   * `System.TimeSpan` (`"00:01:00"` = 1 minute, `"1.00:00:00"` = 1 day).
   * `System.Text.Json` emits this constant-format string by default; the
   * frontend keeps the wire shape and parses on read via
   * {@link parseDurationToMs} from `./parse-duration.js`.
   *
   * `null` / missing = the widget's data source picks a sensible default
   * (e.g. day for last-30d, hour for last-24h).
   */
  readonly aggregation?: string | null;
}

/**
 * Mirrors `Granit.Dashboards.TimeWindowKind`. PascalCase wire values per
 * ADR-039 §6.1.
 */
export type TimeWindowKind = 'History' | 'Realtime';

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
  Last24Hours: { period: { token: 'last_24h' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last7Days: { period: { token: 'last_7d' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last30Days: { period: { token: 'last_30d' }, kind: 'History' } satisfies DashboardTimeWindow,
  Mtd: { period: { token: 'mtd' }, kind: 'History' } satisfies DashboardTimeWindow,
  Ytd: { period: { token: 'ytd' }, kind: 'History' } satisfies DashboardTimeWindow,
  RealtimeLast5Minutes: {
    period: { token: 'last_5m' },
    kind: 'Realtime',
  } satisfies DashboardTimeWindow,
});
