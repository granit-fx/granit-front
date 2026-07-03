import { resolvePeriodToken } from '@granit/timing';

import type { DashboardTimeWindow } from '../types/dashboard-time-window';
import type { PeriodBounds, TimeZoneId, Weekday } from '@granit/timing';

export interface ResolveTimeWindowBoundsOptions {
  /** Reference instant. Injectable for deterministic tests; defaults to now. */
  readonly now?: Date;
  /** First day of week for `wtd` / `pw`. Defaults to Monday (`1`). */
  readonly weekStartsOn?: Weekday;
  /** IANA timezone the calendar tokens are day-aligned in. Omitted = UTC. */
  readonly timeZone?: TimeZoneId;
}

/**
 * Resolves a {@link DashboardTimeWindow} into absolute `[from, to)` bounds for
 * **client-side** use — the range label, the custom-range preview, and the
 * shift / zoom controls. Unlike {@link resolveTimeWindowToRenderRequest}, this
 * is not sent to the server; it computes the same window the backend would,
 * timezone- and first-day-aware, by delegating tokens to `@granit/timing`'s
 * {@link resolvePeriodToken} (a mirror of `Granit.Timing.PeriodResolver`).
 *
 * - An absolute-range window returns its parsed `from` / `to`.
 * - A token window returns the resolved bounds, or `null` for an unknown token.
 */
export function resolveTimeWindowBounds(
  timeWindow: DashboardTimeWindow,
  options: ResolveTimeWindowBoundsOptions = {}
): PeriodBounds | null {
  const { period } = timeWindow;

  if ('from' in period) {
    return { from: new Date(period.from), to: new Date(period.to) };
  }

  return resolvePeriodToken(period.token, options);
}
