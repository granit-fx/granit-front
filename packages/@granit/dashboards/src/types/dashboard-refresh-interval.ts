/**
 * Dashboard auto-refresh cadence — the second top-of-dashboard control alongside
 * the time window (Grafana's refresh picker). Decoupled from the time window's
 * `kind`: liveness is now this setting, not a property of the range.
 *
 * - `'off'` — never auto-refetch.
 * - `'auto'` — defer to each data source's natural cadence (a metric's
 *   `RefreshHint`, the bundle's per-widget hint). This is the default.
 * - a number — a fixed interval in milliseconds.
 */
export type DashboardRefreshInterval = 'off' | 'auto' | number;

/** Grafana-style refresh options, in display order. Values are milliseconds. */
export const DASHBOARD_REFRESH_INTERVAL = Object.freeze({
  Off: 'off',
  Auto: 'auto',
  Sec5: 5_000,
  Sec10: 10_000,
  Sec30: 30_000,
  Min1: 60_000,
  Min5: 300_000,
  Min15: 900_000,
  Min30: 1_800_000,
  Hour1: 3_600_000,
  Hour2: 7_200_000,
  Day1: 86_400_000,
} satisfies Record<string, DashboardRefreshInterval>);

/**
 * Maps a {@link DashboardRefreshInterval} to a TanStack Query `refetchInterval`:
 * `'off'` → `false` (disabled), `'auto'` → `undefined` (let the query keep its
 * own default), a number → that number of milliseconds.
 */
export function toRefetchInterval(refresh: DashboardRefreshInterval): number | false | undefined {
  if (refresh === 'off') return false;
  if (refresh === 'auto') return undefined;
  return refresh;
}
