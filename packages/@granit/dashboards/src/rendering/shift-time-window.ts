import { resolveTimeWindowBounds } from './resolve-time-window-bounds';

import type { ResolveTimeWindowBoundsOptions } from './resolve-time-window-bounds';
import type { DashboardTimeWindow } from '../types/dashboard-time-window';

/** Direction for {@link shiftTimeWindow}: earlier or later by one window length. */
export type ShiftDirection = 'back' | 'forward';

/**
 * Shifts a {@link DashboardTimeWindow} earlier or later by its own length
 * (Grafana's ← / → controls). The window is first resolved to absolute bounds —
 * a token window (`last_7d`, `mtd`, …) becomes an absolute range anchored to the
 * shifted period, since "the previous 7 days" is no longer a rolling token.
 *
 * Returns the window unchanged when it cannot be resolved to bounds (an unknown
 * token). `compareTo` / `aggregation` / `kind` are preserved.
 */
export function shiftTimeWindow(
  timeWindow: DashboardTimeWindow,
  direction: ShiftDirection,
  options?: ResolveTimeWindowBoundsOptions
): DashboardTimeWindow {
  const bounds = resolveBounds(timeWindow, options);
  if (bounds === null) return timeWindow;

  const [from, to] = bounds;
  const length = to - from;
  const delta = direction === 'back' ? -length : length;
  return withAbsolutePeriod(timeWindow, from + delta, to + delta);
}

/**
 * Doubles a {@link DashboardTimeWindow}'s span around its centre (Grafana's
 * zoom-out). Resolves to absolute bounds first, then expands by half the length
 * on each side. Returns the window unchanged when it cannot be resolved.
 */
export function zoomOutTimeWindow(
  timeWindow: DashboardTimeWindow,
  options?: ResolveTimeWindowBoundsOptions
): DashboardTimeWindow {
  const bounds = resolveBounds(timeWindow, options);
  if (bounds === null) return timeWindow;

  const [from, to] = bounds;
  const half = (to - from) / 2;
  return withAbsolutePeriod(timeWindow, from - half, to + half);
}

/** Resolves a window to `[fromMs, toMs)`, or `null` when it has no absolute bounds. */
function resolveBounds(
  timeWindow: DashboardTimeWindow,
  options?: ResolveTimeWindowBoundsOptions
): readonly [number, number] | null {
  const bounds = resolveTimeWindowBounds(timeWindow, options ?? {});
  if (bounds === null) return null;
  return [bounds.from.getTime(), bounds.to.getTime()];
}

function withAbsolutePeriod(
  timeWindow: DashboardTimeWindow,
  fromMs: number,
  toMs: number
): DashboardTimeWindow {
  return {
    ...timeWindow,
    period: { from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString() },
  };
}
