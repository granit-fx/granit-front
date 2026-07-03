/**
 * First day of week as a numeric index: `0` = Sunday … `6` = Saturday.
 *
 * Matches both `Date.getUTCDay()` / `Date.getDay()` and .NET
 * `System.DayOfWeek` (`Sunday = 0`), so a value crosses the wire to the
 * `Granit.Timing` backend resolver without remapping.
 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
