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

/**
 * Grafana-style quick ranges. Every preset is `History` — live cadence is now a
 * separate dashboard-level refresh control, not a property of the time window,
 * so no preset carries `kind: 'Realtime'`.
 *
 * Token semantics are resolved identically on both data paths: server-side by
 * `Granit.Analytics` `PeriodResolver` (inline-metric / definition path) and
 * client-side by `resolveTimeWindowToRenderRequest` (bundle path). `wtd` / `pw`
 * depend on the configured first day of week.
 */
export const DASHBOARD_TIME_WINDOW = Object.freeze({
  // Minutes / hours — rolling window ending now.
  Last5Minutes: { period: { token: 'last_5m' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last15Minutes: { period: { token: 'last_15m' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last30Minutes: { period: { token: 'last_30m' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last1Hour: { period: { token: 'last_1h' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last3Hours: { period: { token: 'last_3h' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last6Hours: { period: { token: 'last_6h' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last12Hours: { period: { token: 'last_12h' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last24Hours: { period: { token: 'last_24h' }, kind: 'History' } satisfies DashboardTimeWindow,
  // Days — day-aligned, through the end of today.
  Last2Days: { period: { token: 'last_2d' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last7Days: { period: { token: 'last_7d' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last30Days: { period: { token: 'last_30d' }, kind: 'History' } satisfies DashboardTimeWindow,
  // Months / years.
  Last3Months: { period: { token: 'last_3mo' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last6Months: { period: { token: 'last_6mo' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last1Year: { period: { token: 'last_1y' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last2Years: { period: { token: 'last_2y' }, kind: 'History' } satisfies DashboardTimeWindow,
  Last5Years: { period: { token: 'last_5y' }, kind: 'History' } satisfies DashboardTimeWindow,
  // Relative single days.
  Today: { period: { token: 'today' }, kind: 'History' } satisfies DashboardTimeWindow,
  Yesterday: { period: { token: 'yesterday' }, kind: 'History' } satisfies DashboardTimeWindow,
  DayBeforeYesterday: {
    period: { token: 'day_before_yesterday' },
    kind: 'History',
  } satisfies DashboardTimeWindow,
  ThisDayLastWeek: {
    period: { token: 'this_day_last_week' },
    kind: 'History',
  } satisfies DashboardTimeWindow,
  // To-date ("so far") — start of the period through the end of today.
  Wtd: { period: { token: 'wtd' }, kind: 'History' } satisfies DashboardTimeWindow,
  Mtd: { period: { token: 'mtd' }, kind: 'History' } satisfies DashboardTimeWindow,
  Qtd: { period: { token: 'qtd' }, kind: 'History' } satisfies DashboardTimeWindow,
  Ytd: { period: { token: 'ytd' }, kind: 'History' } satisfies DashboardTimeWindow,
  // Previous complete periods.
  Pw: { period: { token: 'pw' }, kind: 'History' } satisfies DashboardTimeWindow,
  Pm: { period: { token: 'pm' }, kind: 'History' } satisfies DashboardTimeWindow,
  Pq: { period: { token: 'pq' }, kind: 'History' } satisfies DashboardTimeWindow,
  Py: { period: { token: 'py' }, kind: 'History' } satisfies DashboardTimeWindow,
});
