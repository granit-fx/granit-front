import type { DashboardRenderRequest } from './dashboard-render-request';
import type { DashboardTimeWindow } from '../types/dashboard-time-window';

/** Period portion of a {@link DashboardRenderRequest} — the subset a time window resolves to. */
export type ResolvedRenderPeriod = Pick<
  DashboardRenderRequest,
  'periodFrom' | 'periodTo' | 'periodToken'
>;

/**
 * Maps a {@link DashboardTimeWindow} to the period fields of a
 * {@link DashboardRenderRequest}.
 *
 * The bundle render endpoint (`POST /dashboards/{id}/render`) resolves named
 * tokens **server-side** — timezone- and first-day-aware, via
 * `Granit.Timing.IPeriodResolver` — and **ignores** any `periodFrom` /
 * `periodTo` a client sends alongside a token. So this builder is deliberately
 * thin:
 *
 * - A **token** window emits `{ periodToken }` alone — the server is
 *   authoritative, and sending client-computed bounds would only risk a mismatch
 *   (a phone in a different timezone must not pin the window to its own day).
 * - An **absolute-range** window passes its `from` / `to` through unchanged.
 *
 * Client-side token→bounds resolution still exists for display, preview and the
 * shift / zoom controls — that lives in {@link resolveTimeWindowBounds}, not here.
 */
export function resolveTimeWindowToRenderRequest(
  timeWindow: DashboardTimeWindow
): ResolvedRenderPeriod {
  const { period } = timeWindow;

  if ('from' in period) {
    return { periodFrom: period.from, periodTo: period.to };
  }

  return { periodToken: period.token };
}
