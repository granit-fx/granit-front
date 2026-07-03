import { civilToInstant, localCivilDate } from './time-zone';

import type { Weekday } from './weekday';
import type { TimeZoneId } from '@granit/types';

/** Absolute, half-open `[from, to)` window — the resolved form of a calendar token. */
export interface PeriodBounds {
  readonly from: Date;
  readonly to: Date;
}

export interface ResolvePeriodTokenOptions {
  /** Reference instant. Injectable for deterministic tests; defaults to now. */
  readonly now?: Date;
  /** First day of week for `wtd` / `pw`. Defaults to Monday (`1`). */
  readonly weekStartsOn?: Weekday;
  /**
   * IANA timezone the calendar tokens are day-aligned in. Omitted = UTC, which
   * reproduces the historical bounds exactly (non-regression).
   */
  readonly timeZone?: TimeZoneId;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** Rolling sub-day tokens, resolved as `[now - duration, now)` — timezone-independent. */
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
 * Resolves a named calendar token (`last_30d`, `mtd`, `pw`, `today`, …) into
 * absolute `[from, to)` bounds, **mirroring `Granit.Timing.PeriodResolver`
 * exactly** so a window resolved client-side (display, preview, shift arrows)
 * matches what the server resolves for the same token:
 *
 * - Sub-day rolling tokens end at `now`, in absolute instants (timezone-independent).
 * - Day / week / month / quarter / year tokens are day-aligned in the local day
 *   of `timeZone`, then converted back to UTC DST-correctly. `wtd` / `pw` depend
 *   on `weekStartsOn`; month/year arithmetic clamps the day to the target
 *   month's last day like .NET `DateTime.AddMonths` / `AddYears`.
 *
 * Returns `null` for an unknown token — the caller decides how to degrade.
 */
export function resolvePeriodToken(
  token: string,
  options: ResolvePeriodTokenOptions = {}
): PeriodBounds | null {
  const now = options.now ?? new Date();

  const duration = DURATION_MS[token];
  if (duration !== undefined) {
    return { from: new Date(now.getTime() - duration), to: now };
  }

  const weekStartsOn = options.weekStartsOn ?? 1;
  const timeZone = options.timeZone;

  const day0 = localCivilDate(now, timeZone);
  const civil = resolveCivilBounds(token, day0, weekStartsOn);
  if (civil === null) return null;

  return {
    from: civilToInstant(civil.from, timeZone),
    to: civilToInstant(civil.to, timeZone),
  };
}

/** Resolves the day-aligned civil `[from, to)` carriers for a calendar token. */
function resolveCivilBounds(token: string, day0: Date, weekStartsOn: Weekday): PeriodBounds | null {
  const endOfToday = addDays(day0, 1);

  switch (token) {
    // Day / month / year rolling — day-aligned, through end of today.
    case 'last_2d':
      return { from: addDays(day0, -2), to: endOfToday };
    case 'last_7d':
      return { from: addDays(day0, -7), to: endOfToday };
    case 'last_30d':
      return { from: addDays(day0, -30), to: endOfToday };
    case 'last_3mo':
      return { from: addMonths(day0, -3), to: endOfToday };
    case 'last_6mo':
      return { from: addMonths(day0, -6), to: endOfToday };
    case 'last_1y':
      return { from: addMonths(day0, -12), to: endOfToday };
    case 'last_2y':
      return { from: addMonths(day0, -24), to: endOfToday };
    case 'last_5y':
      return { from: addMonths(day0, -60), to: endOfToday };

    // Relative single days.
    case 'today':
      return { from: day0, to: endOfToday };
    case 'yesterday':
      return { from: addDays(day0, -1), to: day0 };
    case 'day_before_yesterday':
      return { from: addDays(day0, -2), to: addDays(day0, -1) };
    case 'this_day_last_week':
      return { from: addDays(day0, -7), to: addDays(day0, -6) };

    // To-date ("so far") — start of period through end of today.
    case 'wtd':
      return { from: startOfWeek(day0, weekStartsOn), to: endOfToday };
    case 'mtd':
      return { from: startOfMonth(day0), to: endOfToday };
    case 'qtd':
      return { from: startOfQuarter(day0), to: endOfToday };
    case 'ytd':
      return { from: startOfYear(day0), to: endOfToday };

    // Previous complete periods.
    case 'pw': {
      const weekStart = startOfWeek(day0, weekStartsOn);
      return { from: addDays(weekStart, -7), to: weekStart };
    }
    case 'pm': {
      const monthStart = startOfMonth(day0);
      return { from: addMonths(monthStart, -1), to: monthStart };
    }
    case 'pq': {
      const quarterStart = startOfQuarter(day0);
      return { from: addMonths(quarterStart, -3), to: quarterStart };
    }
    case 'py': {
      const yearStart = startOfYear(day0);
      return { from: addMonths(yearStart, -12), to: yearStart };
    }

    default:
      return null;
  }
}

// --- Civil-date calendar math. Operates on midnight-UTC carriers via `getUTC*`
// / `Date.UTC` — DST-agnostic and exact; the timezone is applied only later by
// `civilToInstant`. ---

function addDays(d: Date, days: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}

/** Adds months, clamping the day to the target month's last day (matches .NET `AddMonths`). */
function addMonths(d: Date, months: number): Date {
  const total = d.getUTCMonth() + months;
  const year = d.getUTCFullYear() + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(d.getUTCDate(), lastDay)));
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfQuarter(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1));
}

function startOfYear(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

function startOfWeek(d: Date, weekStartsOn: Weekday): Date {
  const diff = (d.getUTCDay() - weekStartsOn + 7) % 7;
  return addDays(d, -diff);
}
