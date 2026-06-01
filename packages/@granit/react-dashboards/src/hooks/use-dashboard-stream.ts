import { useEffect } from 'react';

import { useDashboardsConfig } from '../providers/dashboards-provider';

import type {
  DashboardRenderedWidget,
  RefreshHint,
  WidgetSnapshotStatus,
} from '@granit/dashboards';

/**
 * Wire shape of an `event: snapshot` frame on the dashboard SSE
 * stream (`GET /dashboards/{id}/stream`, ADR-043 §3). Mirrors the
 * payload the SSE handler serialises — structural fields (`slug`,
 * `position`, `width`, `height`, `titleLocalizationKey`, `actions`,
 * `requiredPermission`, `transport`) are NOT carried; the frontend
 * already has them from the seed pull and the stream only pushes the
 * dynamic projection.
 *
 * `widgetId` matches the persisted `WidgetInstance.Id` and the same
 * widget the seed bundle's {@link DashboardRenderedWidget.id} carries.
 */
export interface DashboardStreamSnapshot {
  readonly widgetId: string;
  readonly widgetType: string;
  readonly status: WidgetSnapshotStatus;
  readonly sequence: number;
  readonly emittedAt: string;
  readonly refreshHint: RefreshHint;
  readonly snapshot: unknown;
  readonly reasonLocalizationKey: string | null;
}

/**
 * Merges a snapshot event onto the corresponding seed envelope. Pure
 * — exported for tests + apps that drive their own subscription
 * pipeline (custom transport adapters).
 *
 * Drops the event when the seed envelope is missing (no in-flight
 * `useDashboardRender`) or when the seed already carries an envelope
 * with a higher `sequence` (out-of-order delivery, replay collision).
 */
export function applyStreamSnapshot(
  current: DashboardRenderedWidget | undefined,
  event: DashboardStreamSnapshot
): DashboardRenderedWidget | undefined {
  if (!current) return current;
  if (current.sequence > event.sequence) return current;
  return {
    ...current,
    widgetType: event.widgetType,
    status: event.status,
    sequence: event.sequence,
    emittedAt: event.emittedAt,
    refreshHint: event.refreshHint,
    snapshot: event.snapshot,
    reasonLocalizationKey: event.reasonLocalizationKey,
  };
}

/**
 * Configuration for {@link useDashboardStream}.
 */
export interface UseDashboardStreamOptions {
  /**
   * Open the connection only when `true`. Hosts typically gate this
   * on "any widget in the seed has `transport === 'Push'`" to avoid
   * burning a long-lived connection on dashboards that are pure
   * pull. Defaults to `true`.
   */
  readonly enabled?: boolean;
  /** Fires once per `event: snapshot` frame, after JSON parse. */
  readonly onSnapshot?: (event: DashboardStreamSnapshot) => void;
  /**
   * Fires when the server emits `event: resume-failed` — the
   * client's `Last-Event-ID` is past the ring's oldest entry and a
   * fresh seed pull is required. Hosts typically invalidate the
   * dashboard render query in response so `useDashboardRender`
   * refetches.
   */
  readonly onResumeFailed?: () => void;
  /**
   * Fires on `EventSource.onerror`. Note that the browser
   * `EventSource` auto-reconnects on transient failures (carrying
   * the SSE `Last-Event-ID` header) — this callback is informational
   * and shouldn't trigger custom reconnect logic.
   */
  readonly onError?: (event: Event) => void;
}

/**
 * Subscribes to the dashboard's SSE stream
 * (`GET /dashboards/{id}/stream`, ADR-043 §3). Opens an
 * `EventSource` when `enabled`, parses typed snapshot frames and
 * delivers them to `onSnapshot`. Closes on unmount or when
 * `enabled` flips to `false`.
 *
 * The hook is presentational — it does not touch the TanStack
 * cache. Use {@link usePushedDashboard} for the composed hook that
 * surgically merges snapshots into the per-widget cache entries.
 *
 * `EventSource` is browser-only. In SSR / non-DOM environments the
 * hook is a no-op (the `useEffect` body never runs).
 */
export function useDashboardStream(
  dashboardId: string,
  options: UseDashboardStreamOptions = {}
): void {
  const { client, basePath } = useDashboardsConfig();
  const { enabled = true, onSnapshot, onResumeFailed, onError } = options;

  useEffect(() => {
    if (!enabled) return;
    if (typeof EventSource === 'undefined') return;
    const baseURL = client.defaults.baseURL ?? '';
    const url = `${baseURL}${basePath}/${encodeURIComponent(dashboardId)}/stream`;
    // `withCredentials: true` mirrors the api client's BFF mode so
    // session cookies travel with the SSE handshake. Bearer-mode
    // hosts don't need it (the cookie is empty) — the flag is
    // harmless either way.
    const source = new EventSource(url, { withCredentials: true });

    const handleSnapshot = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as DashboardStreamSnapshot;
        onSnapshot?.(payload);
      } catch {
        // Malformed JSON — drop the frame silently. The server is
        // authoritative; bad frames are a server bug, not something
        // the hook should retry around.
      }
    };
    const handleResumeFailed = () => {
      onResumeFailed?.();
    };
    const handleError = (event: Event) => {
      onError?.(event);
    };

    source.addEventListener('snapshot', handleSnapshot);
    source.addEventListener('resume-failed', handleResumeFailed);
    source.addEventListener('error', handleError);

    return () => {
      source.removeEventListener('snapshot', handleSnapshot);
      source.removeEventListener('resume-failed', handleResumeFailed);
      source.removeEventListener('error', handleError);
      source.close();
    };
  }, [client, basePath, dashboardId, enabled, onSnapshot, onResumeFailed, onError]);
}
