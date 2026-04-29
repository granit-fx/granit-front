/**
 * Parses a `System.TimeSpan` JSON serialization into milliseconds.
 *
 * `System.Text.Json` serializes `TimeSpan` as a constant-format string with no
 * naming policy: `"00:01:00"` (1 minute), `"1.02:30:00"` (1 day, 2h30m),
 * `"00:00:00.5000000"` (500ms). The frontend gets this verbatim — there's no
 * automatic ms conversion. Backend convention preserved per the
 * `aggregation` field arbitration: ISO-string-on-the-wire, parse-on-read in
 * the frontend (helper kept local to avoid pulling a date library).
 *
 * Format: `[d.]hh:mm:ss[.fffffff]`
 *
 * - `d` (optional): days, integer.
 * - `hh:mm:ss`: hours / minutes / seconds, two digits each.
 * - `.fffffff` (optional): fractional seconds, up to 7 digits (.NET ticks).
 *
 * Returns `null` when the input doesn't match the expected shape — callers
 * fall back to a sensible default rather than crashing.
 *
 * @example
 *   parseDurationToMs('00:01:00');         // → 60_000
 *   parseDurationToMs('1.00:00:00');       // → 86_400_000
 *   parseDurationToMs('00:00:00.5000000'); // → 500
 *   parseDurationToMs('garbage');          // → null
 */
export function parseDurationToMs(value: string | null | undefined): number | null {
  if (value == null) return null;
  const match = /^(?:(\d+)\.)?(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,7}))?$/.exec(value);
  if (!match) return null;

  const [, daysStr, hoursStr, minutesStr, secondsStr, fractionStr] = match;
  const days = daysStr ? Number.parseInt(daysStr, 10) : 0;
  const hours = Number.parseInt(hoursStr ?? '0', 10);
  const minutes = Number.parseInt(minutesStr ?? '0', 10);
  const seconds = Number.parseInt(secondsStr ?? '0', 10);
  // Fractional seconds: pad/truncate to 3 digits (milliseconds).
  // ".NET ticks" go to 7 digits but we cap at ms — sub-ms granularity is
  // beyond what time-window aggregations need.
  const millis = fractionStr ? Number.parseInt(fractionStr.slice(0, 3).padEnd(3, '0'), 10) : 0;

  return days * 86_400_000 + hours * 3_600_000 + minutes * 60_000 + seconds * 1_000 + millis;
}

/**
 * Inverse of {@link parseDurationToMs} — formats a millisecond count as a
 * `System.TimeSpan`-shaped ISO string. Used when the frontend authors a
 * `DashboardTimeWindow.aggregation` value to send back through CRUD.
 *
 * Negative or non-finite inputs return `null`.
 *
 * @example
 *   formatDurationFromMs(60_000);     // → "00:01:00"
 *   formatDurationFromMs(86_400_000); // → "1.00:00:00"
 *   formatDurationFromMs(500);        // → "00:00:00.500"
 */
export function formatDurationFromMs(ms: number): string | null {
  if (!Number.isFinite(ms) || ms < 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const fractionMs = ms - totalSeconds * 1000;
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const base = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  const withDays = days > 0 ? `${days}.${base}` : base;
  return fractionMs > 0 ? `${withDays}.${fractionMs.toString().padStart(3, '0')}` : withDays;
}
