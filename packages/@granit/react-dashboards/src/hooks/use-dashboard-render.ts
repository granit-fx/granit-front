import { HttpError } from '@granit/api-client';
import { renderDashboard } from '@granit/dashboards';
import {
  useQuery,
  useQueryClient,
  type Query,
  type QueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { useDashboardsConfig } from '../providers/dashboards-provider';

import type {
  DashboardRenderedWidget,
  DashboardRenderRequest,
  DashboardRenderResponse,
  RefreshHint,
} from '@granit/dashboards';

/**
 * Polling cadence per {@link RefreshHint} for the bundle-level refetch. The
 * hook re-evaluates this on every TanStack tick so a `Static` bundle stops
 * polling itself, a `Dynamic` one stays cached, and a `Realtime` one polls
 * until the SSE / WS push transport (P2.4) replaces polling entirely.
 *
 * The bundle's effective hint is the **strongest** hint among its widgets:
 * one realtime widget pulls the whole bundle into the realtime cadence so
 * each widget's per-widget cache entry stays fresh.
 */
const POLLING_INTERVAL_MS: Readonly<Record<RefreshHint, number | false>> = {
  Static: false,
  Dynamic: false,
  Realtime: 5_000,
};

const REFRESH_HINT_RANK: Readonly<Record<RefreshHint, number>> = {
  Static: 0,
  Dynamic: 1,
  Realtime: 2,
};

export interface UseDashboardRenderOptions {
  /** Disable the request — useful when the parent isn't ready (e.g. tenant pending). */
  readonly enabled?: boolean;
  /**
   * Force a polling interval, overriding the cadence the strongest widget
   * `refreshHint` would otherwise dictate. `false` disables polling entirely.
   */
  readonly refetchInterval?: number | false;
}

/**
 * Cache key composer. Exported for tests + for sibling hooks that need to
 * address the same query without going through the hook itself.
 */
export const dashboardRenderQueryKey = (dashboardId: string, request: DashboardRenderRequest) =>
  ['dashboard', dashboardId, 'render', request] as const;

/**
 * Cache key composer for the **per-widget** TanStack entries the hook
 * populates from the bundle response (ADR-039 §6.2). Use it from
 * {@link useDashboardWidget} to read a single widget's envelope.
 */
export const dashboardWidgetQueryKey = (dashboardId: string, widgetId: string) =>
  ['dashboard', dashboardId, 'widget', widgetId] as const;

/**
 * Calls `POST /dashboards/{id}/render` and returns the bundle response.
 *
 * **Bundle is a transport optimisation, not the cache identity.** Per
 * ADR-039 §6.2, the hook splits the response into one TanStack Query entry
 * per widget (`['dashboard', dashboardId, 'widget', widgetId]`) on every
 * successful fetch — so:
 *
 * - The future SSE / WS push transport (P2.4) reconciles per-widget
 *   `{ widgetId, sequence, delta }` messages without a global refetch.
 * - Per-widget consumers (`useDashboardWidget`) survive partial bundle
 *   refreshes — only widgets whose envelope actually changed re-render.
 *
 * Polling cadence is derived from the strongest `refreshHint` across the
 * bundle's widgets (Realtime > Dynamic > Static). 4xx are deterministic
 * (dashboard not found, malformed period spec) and never retry.
 */
export function useDashboardRender(
  dashboardId: string,
  request: DashboardRenderRequest = {},
  options: UseDashboardRenderOptions = {}
): UseQueryResult<DashboardRenderResponse> {
  const { client, basePath } = useDashboardsConfig();
  const queryClient = useQueryClient();
  const normalizedRequest = useMemo(() => normalizeRequest(request), [request]);

  const queryKey = useMemo(
    () => dashboardRenderQueryKey(dashboardId, normalizedRequest),
    [dashboardId, normalizedRequest]
  );

  const result = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      renderDashboard(client, basePath, dashboardId, normalizedRequest, { signal }),
    enabled: options.enabled ?? true,
    retry: shouldRetry,
    staleTime: 60_000,
    refetchInterval: options.refetchInterval ?? refetchIntervalFromBundle,
  });

  // Per-widget cache split runs on every successful refetch (initial load,
  // background refetch, manual invalidation). Effects that mutate the
  // QueryClient outside the queryFn keep the per-widget entries authoritative
  // for any consumer reading them via dashboardWidgetQueryKey().
  useEffect(() => {
    if (!result.data) return;
    splitBundleIntoWidgetCacheEntries(queryClient, dashboardId, result.data);
  }, [queryClient, dashboardId, result.data]);

  return result;
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

function refetchIntervalFromBundle(
  query: Query<DashboardRenderResponse, Error, DashboardRenderResponse, readonly unknown[]>
): number | false {
  const data = query.state.data;
  if (!data) return false;
  return POLLING_INTERVAL_MS[strongestRefreshHint(data.widgets)];
}

/**
 * Picks the strongest hint across the bundle's widgets. Exported for tests
 * + for consumers that compose their own polling strategy (e.g. an editor
 * pane that pauses polling while the user drags a widget).
 */
export function strongestRefreshHint(widgets: readonly DashboardRenderedWidget[]): RefreshHint {
  let strongest: RefreshHint = 'Static';
  for (const widget of widgets) {
    if (REFRESH_HINT_RANK[widget.refreshHint] > REFRESH_HINT_RANK[strongest]) {
      strongest = widget.refreshHint;
    }
  }
  return strongest;
}

function splitBundleIntoWidgetCacheEntries(
  queryClient: QueryClient,
  dashboardId: string,
  bundle: DashboardRenderResponse
): void {
  for (const widget of bundle.widgets) {
    queryClient.setQueryData<DashboardRenderedWidget>(
      dashboardWidgetQueryKey(dashboardId, widget.id),
      widget
    );
  }
}

/**
 * Produces a canonical request shape so semantically-equivalent inputs
 * collapse to the same query key (and therefore the same cache entry,
 * in-flight request, and — once streaming lands — subscription identity).
 *
 * Exported for testing. Consumers go through {@link useDashboardRender}.
 */
export function normalizeDashboardRenderRequest(
  request: DashboardRenderRequest
): DashboardRenderRequest {
  const normalized: Record<string, unknown> = {};
  if (request.periodFrom !== undefined) normalized['periodFrom'] = request.periodFrom;
  if (request.periodTo !== undefined) normalized['periodTo'] = request.periodTo;
  if (request.periodToken !== undefined) normalized['periodToken'] = request.periodToken;
  if (request.locale !== undefined) normalized['locale'] = request.locale;
  if (request.filters !== undefined && request.filters !== null) {
    normalized['filters'] = canonicalizeFilters(request.filters);
  }
  if (request.viewName !== undefined) normalized['viewName'] = request.viewName;
  return normalized as DashboardRenderRequest;
}

function canonicalizeFilters(
  filters: Readonly<Record<string, string>>
): Readonly<Record<string, string>> {
  // Sort keys so semantically-identical filter maps share a JSON-stringified
  // identity (same TanStack queryKey hash, same SSE topic later).
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(filters).sort((a, b) => a.localeCompare(b))) {
    sorted[key] = filters[key]!;
  }
  return sorted;
}

function normalizeRequest(request: DashboardRenderRequest): DashboardRenderRequest {
  return normalizeDashboardRenderRequest(request);
}
