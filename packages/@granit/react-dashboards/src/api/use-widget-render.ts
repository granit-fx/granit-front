import { HttpError } from '@granit/api-client';
import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type Query, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useDashboardFilters } from '../components/dashboard-filter-context.js';
import { mergeFilterValuesIntoRequest } from '../lib/merge-filter-values.js';

import type {
  DashboardRenderedWidget,
  RefreshHint,
  WidgetDefinitionBase,
} from '@granit/dashboards';

const WIDGET_RENDER_PATH = '/widgets';

/**
 * Polling cadence per {@link RefreshHint} for the per-widget render
 * (P3 backend endpoints). Mirror of the bundle-path semantics —
 * `Static` doesn't poll, `Dynamic` stays cached, `Realtime` polls
 * until the SSE/WS push transport (P2.4) replaces polling entirely.
 */
const POLLING_INTERVAL_MS: Readonly<Record<RefreshHint, number | false>> = {
  Static: false,
  Dynamic: false,
  Realtime: 5_000,
};

/**
 * Optional context propagated through the per-widget render
 * endpoints — same shape as the bundle render request's
 * {@link DashboardRenderRequest} except for the dashboard-scoped
 * fields (`viewName` / `dashboardId`) which don't apply to
 * single-widget rendering.
 */
export interface WidgetRenderContext {
  /** Inclusive lower bound (ISO 8601 UTC). Required when {@link periodTo} is set. */
  readonly periodFrom?: string;
  /** Exclusive upper bound (ISO 8601 UTC). Required when {@link periodFrom} is set. */
  readonly periodTo?: string;
  /** Optional named token (`'mtd'`, `'qtd'`, …) — echoed in the response. */
  readonly periodToken?: string;
  /** Active BCP-47 locale. */
  readonly locale?: string;
  /**
   * Per-render filter overrides. Live values from the surrounding
   * `<DashboardFilterProvider>` (when mounted) merge over this map
   * via {@link mergeFilterValuesIntoRequest}.
   */
  readonly filters?: Readonly<Record<string, string>> | null;
}

/**
 * Wire-format kinds the P3 backend endpoints accept. Lowercase
 * matches the URL path slug (`/widgets/{kind}/render`) and the
 * `WidgetDefinition.type` discriminator.
 */
export type WidgetRenderKind = 'kpi' | 'chart' | 'table' | 'pivot' | 'map';

/**
 * Cache key composer for `useWidgetRender`. Keyed by
 * `(kind, definition, context)` so semantically-identical inputs
 * collapse to the same cache entry / in-flight request — same
 * convention as the bundle path's `dashboardRenderQueryKey`.
 */
export const widgetRenderQueryKey = <TDefinition extends WidgetDefinitionBase>(
  kind: WidgetRenderKind,
  definition: TDefinition,
  context: WidgetRenderContext
) => ['widget', kind, 'render', definition, context] as const;

export interface UseWidgetRenderOptions {
  /** Disable the request — useful when the parent isn't ready (e.g. tenant pending). */
  readonly enabled?: boolean;
  /**
   * Force a polling interval, overriding the cadence the response's
   * `refreshHint` would otherwise dictate. `false` disables polling.
   */
  readonly refetchInterval?: number | false;
}

/**
 * Calls `POST /widgets/{kind}/render` (backend P3 — symmetric with
 * the bundle path) and returns a single
 * {@link DashboardRenderedWidget} envelope.
 *
 * The endpoint accepts the full {@link WidgetDefinition} in the body
 * — works equally well for persisted widgets (definition lifted via
 * {@link widgetInstanceToDefinition}) and ad-hoc previews (catalog
 * thumbnails, in-editor live render). Returns the same envelope
 * shape as the bundle path, so the response slots straight into
 * `<RenderedWidget widget={data} />` for chrome + action dispatch
 * uniformity.
 *
 * Filter values from the surrounding {@link DashboardFilterProvider}
 * (when mounted) merge into `context.filters` automatically — apps
 * wrapping `<ChartTile>` etc. inside a filter provider get reactive
 * filtering for free.
 *
 * Polling cadence is derived from the response's `refreshHint`
 * (Realtime → 5s, others → no polling). 4xx are deterministic
 * (validation / not found) and never retry.
 */
export function useWidgetRender<TDefinition extends WidgetDefinitionBase>(
  kind: WidgetRenderKind,
  definition: TDefinition,
  context: WidgetRenderContext = {},
  options: UseWidgetRenderOptions = {}
): UseQueryResult<DashboardRenderedWidget> {
  const api = useGranitClient();
  const filters = useDashboardFilters();

  const effectiveContext = useMemo(() => {
    return mergeFilterValuesIntoRequest(context, filters?.values) as WidgetRenderContext;
  }, [context, filters?.values]);

  const queryKey = useMemo(
    () => widgetRenderQueryKey(kind, definition, effectiveContext),
    [kind, definition, effectiveContext]
  );

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const { data } = await api.post<DashboardRenderedWidget>(
        `${WIDGET_RENDER_PATH}/${kind}/render`,
        { definition, context: effectiveContext },
        { signal }
      );
      return data;
    },
    enabled: options.enabled ?? true,
    retry: shouldRetry,
    staleTime: 60_000,
    refetchInterval: options.refetchInterval ?? refetchIntervalFromHint,
  });
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

function refetchIntervalFromHint(
  query: Query<DashboardRenderedWidget, Error, DashboardRenderedWidget, readonly unknown[]>
): number | false {
  const data = query.state.data;
  if (!data) return false;
  return POLLING_INTERVAL_MS[data.refreshHint];
}
