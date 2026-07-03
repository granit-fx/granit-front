import { TZDate } from '@date-fns/tz';

import type { TimeZoneId } from '@granit/types';

/**
 * Timezone-aware bridge between a *civil* calendar date and an absolute
 * instant, mirroring the backend's `IClock.ConvertToUserTime` /
 * `ToUtcFromUserLocal` pair (`Granit.Timing`).
 *
 * A **civil date** is carried as a `Date` pinned to midnight *UTC* — a register
 * for year/month/day arithmetic, deliberately stripped of any timezone. All
 * calendar math (add days/months, week/month/quarter/year starts) runs on these
 * carriers through the `getUTC*` / `Date.UTC` accessors, which are DST-agnostic
 * and exact. A civil date only becomes a real instant at the very end, via
 * {@link civilToInstant}.
 *
 * Without a `timeZone` every conversion is the identity on UTC, so the whole
 * pipeline reproduces the historical UTC-only behaviour byte-for-byte.
 */

/** Midnight-UTC civil carrier for the calendar date of `instant` in `timeZone`. */
export function localCivilDate(instant: Date, timeZone: TimeZoneId | undefined): Date {
  if (timeZone === undefined) {
    return new Date(
      Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate())
    );
  }
  // `TZDate(ms, tz)` reads back its Y/M/D accessors in the target zone.
  const local = new TZDate(instant.getTime(), timeZone);
  return new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
}

/**
 * Maps a civil midnight to the UTC instant at which that wall-clock midnight
 * occurs in `timeZone`.
 *
 * Without a timezone the civil carrier already *is* the UTC instant (UTC-only
 * behaviour). With one, `TZDate` resolves the local offset DST-correctly, so a
 * calendar "day" spans 23/24/25 h across a transition. Nonexistent
 * (spring-forward) and ambiguous (fall-back) local midnights resolve however
 * `@date-fns/tz` resolves them — deterministically, toward the post-transition
 * offset; day boundaries at midnight almost never fall inside a DST gap in
 * practice.
 */
export function civilToInstant(civil: Date, timeZone: TimeZoneId | undefined): Date {
  if (timeZone === undefined) return civil;
  // `TZDate(y, m, d, tz)` interprets the fields as a wall-clock time in `tz`.
  return new Date(
    new TZDate(civil.getUTCFullYear(), civil.getUTCMonth(), civil.getUTCDate(), timeZone).getTime()
  );
}
