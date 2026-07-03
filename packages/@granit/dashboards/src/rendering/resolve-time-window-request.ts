import type { DashboardRenderRequest } from './dashboard-render-request';
import type { DashboardTimeWindow } from '../types/dashboard-time-window';

/** Period portion of a {@link DashboardRenderRequest} — the subset a time window resolves to. */
export type ResolvedRenderPeriod = Pick<
  DashboardRenderRequest,
  'periodFrom' | 'periodTo' | 'periodToken'
>;

/** First day of week: `0` = Sunday … `6` = Saturday (matches `Date.getUTCDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ResolveTimeWindowOptions {
  /** Reference instant. Injectable for deterministic tests; defaults to now. */
  readonly now?: Date;
  /** First day of week for `wtd` / `pw`. Defaults to Monday (`1`). */
  readonly weekStartsOn?: Weekday;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** Rolling sub-day tokens, resolved as `[now - duration, now)`. */
const DURATION_MS: Readonly<Record<string, number>> = {
  last_60s: MINUTE_MS,
  last_5m: 5 * MINUTE_MS,
  last_15m: 15 * MINUTE_MS,
  last_30m: 30 * MINUTE_MS,
  last_1h: HOUR_MS,
  last_3h: 3 * HOUR_MS,
  last_6h: 6 * HOUR_MS,
  last_12h: 12 * HOUR_MS,
  last_24h: 24 * HOUR_MS,
};

/**
 * Resolves a {@link DashboardTimeWindow} into the absolute `[periodFrom, periodTo)`
 * bounds a {@link DashboardRenderRequest} requires.
 *
 * The bundle render endpoint (`POST /dashboards/{id}/render`) does NOT resolve
 * named tokens server-side — unlike the inline-metric endpoint — so calendar
 * tokens (`last_30d`, `mtd`, `pw`, …) are turned into UTC bounds here. **The
 * semantics mirror `Granit.Analytics` `PeriodResolver` exactly** so a widget
 * bound through either path resolves the same window: sub-day tokens end at
 * `now`; day / calendar tokens are day-aligned and run through the end of today
 * (`todayStart + 1d`, exclusive); month/year arithmetic clamps the day to the
 * target month like .NET `DateTime.AddMonths`.
 *
 * - An absolute-range window passes its `from` / `to` through unchanged.
 * - A token with no known resolution degrades to `periodToken` alone — the
 *   endpoint requires the two bounds as a pair, so emitting only one is a 400;
 *   omitting both renders unbounded.
 *
 * `now` and `weekStartsOn` are injectable via {@link ResolveTimeWindowOptions}.
 */
export function resolveTimeWindowToRenderRequest(
  timeWindow: DashboardTimeWindow,
  options: ResolveTimeWindowOptions = {}
): ResolvedRenderPeriod {
  const { period } = timeWindow;

  if ('from' in period) {
    return { periodFrom: period.from, periodTo: period.to };
  }

  const now = options.now ?? new Date();
  const weekStartsOn = options.weekStartsOn ?? 1;
  const bounds = resolveToken(period.token, now, weekStartsOn);

  if (bounds === null) {
    return { periodToken: period.token };
  }

  return {
    periodFrom: bounds.from.toISOString(),
    periodTo: bounds.to.toISOString(),
    periodToken: period.token,
  };
}

interface Bounds {
  readonly from: Date;
  readonly to: Date;
}

function resolveToken(token: string, now: Date, weekStartsOn: Weekday): Bounds | null {
  const duration = DURATION_MS[token];
  if (duration !== undefined) {
    return { from: new Date(now.getTime() - duration), to: now };
  }

  const day0 = startOfUtcDay(now);
  const endOfToday = addUtcDays(day0, 1);

  switch (token) {
    // Day / month / year rolling — day-aligned, through end of today.
    case 'last_2d':
      return { from: addUtcDays(day0, -2), to: endOfToday };
    case 'last_7d':
      return { from: addUtcDays(day0, -7), to: endOfToday };
    case 'last_30d':
      return { from: addUtcDays(day0, -30), to: endOfToday };
    case 'last_3mo':
      return { from: addUtcMonths(day0, -3), to: endOfToday };
    case 'last_6mo':
      return { from: addUtcMonths(day0, -6), to: endOfToday };
    case 'last_1y':
      return { from: addUtcMonths(day0, -12), to: endOfToday };
    case 'last_2y':
      return { from: addUtcMonths(day0, -24), to: endOfToday };
    case 'last_5y':
      return { from: addUtcMonths(day0, -60), to: endOfToday };

    // Relative single days.
    case 'today':
      return { from: day0, to: endOfToday };
    case 'yesterday':
      return { from: addUtcDays(day0, -1), to: day0 };
    case 'day_before_yesterday':
      return { from: addUtcDays(day0, -2), to: addUtcDays(day0, -1) };
    case 'this_day_last_week':
      return { from: addUtcDays(day0, -7), to: addUtcDays(day0, -6) };

    // To-date ("so far") — start of period through end of today.
    case 'wtd':
      return { from: startOfUtcWeek(day0, weekStartsOn), to: endOfToday };
    case 'mtd':
      return { from: startOfUtcMonth(day0), to: endOfToday };
    case 'qtd':
      return { from: startOfUtcQuarter(day0), to: endOfToday };
    case 'ytd':
      return { from: startOfUtcYear(day0), to: endOfToday };

    // Previous complete periods.
    case 'pw': {
      const weekStart = startOfUtcWeek(day0, weekStartsOn);
      return { from: addUtcDays(weekStart, -7), to: weekStart };
    }
    case 'pm': {
      const monthStart = startOfUtcMonth(day0);
      return { from: addUtcMonths(monthStart, -1), to: monthStart };
    }
    case 'pq': {
      const quarterStart = startOfUtcQuarter(day0);
      return { from: addUtcMonths(quarterStart, -3), to: quarterStart };
    }
    case 'py': {
      const yearStart = startOfUtcYear(day0);
      return { from: addUtcMonths(yearStart, -12), to: yearStart };
    }

    default:
      return null;
  }
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, days: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}

/** Adds months, clamping the day to the target month's last day (matches .NET `AddMonths`). */
function addUtcMonths(d: Date, months: number): Date {
  const total = d.getUTCMonth() + months;
  const year = d.getUTCFullYear() + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(d.getUTCDate(), lastDay)));
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfUtcQuarter(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1));
}

function startOfUtcYear(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

function startOfUtcWeek(d: Date, weekStartsOn: Weekday): Date {
  const diff = (d.getUTCDay() - weekStartsOn + 7) % 7;
  return addUtcDays(d, -diff);
}
