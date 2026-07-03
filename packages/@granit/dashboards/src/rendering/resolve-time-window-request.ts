import type { DashboardRenderRequest } from './dashboard-render-request';
import type { DashboardTimeWindow } from '../types/dashboard-time-window';

/** Period portion of a {@link DashboardRenderRequest} — the subset a time window resolves to. */
export type ResolvedRenderPeriod = Pick<
  DashboardRenderRequest,
  'periodFrom' | 'periodTo' | 'periodToken'
>;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Rolling-window tokens resolvable as `now - duration`. */
const DURATION_MS: Readonly<Record<string, number>> = {
  last_60s: MINUTE_MS,
  last_5m: 5 * MINUTE_MS,
  last_24h: DAY_MS,
  last_7d: 7 * DAY_MS,
  last_30d: 30 * DAY_MS,
};

/**
 * Resolves a {@link DashboardTimeWindow} into the absolute `[periodFrom, periodTo)`
 * bounds a {@link DashboardRenderRequest} requires.
 *
 * The bundle render endpoint (`POST /dashboards/{id}/render`) does NOT resolve
 * named tokens server-side — unlike the inline-metric endpoint — so calendar
 * tokens (`last_30d`, `mtd`, `ytd`, …) must be turned into UTC bounds here. The
 * originating token is echoed back as `periodToken` for client convenience.
 *
 * - An absolute-range window passes its `from` / `to` through unchanged.
 * - A token with no known resolution (e.g. an app-specific one) degrades to
 *   `periodToken` alone — the endpoint requires the two bounds as a pair, so
 *   emitting only one would be a 400; omitting both renders unbounded.
 *
 * `now` is injectable for deterministic tests; it defaults to the current time.
 */
export function resolveTimeWindowToRenderRequest(
  timeWindow: DashboardTimeWindow,
  now: Date = new Date()
): ResolvedRenderPeriod {
  const { period } = timeWindow;

  if ('from' in period) {
    return { periodFrom: period.from, periodTo: period.to };
  }

  const { token } = period;
  const from = resolveTokenStart(token, now);
  if (from === null) {
    return { periodToken: token };
  }

  return { periodFrom: from.toISOString(), periodTo: now.toISOString(), periodToken: token };
}

/** Absolute start instant for a token, or `null` when the token is not resolvable. */
function resolveTokenStart(token: string, now: Date): Date | null {
  const duration = DURATION_MS[token];
  if (duration !== undefined) {
    return new Date(now.getTime() - duration);
  }

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  switch (token) {
    case 'today':
      return new Date(Date.UTC(year, month, now.getUTCDate()));
    case 'mtd':
      return new Date(Date.UTC(year, month, 1));
    case 'qtd':
      return new Date(Date.UTC(year, Math.floor(month / 3) * 3, 1));
    case 'ytd':
      return new Date(Date.UTC(year, 0, 1));
    default:
      return null;
  }
}
