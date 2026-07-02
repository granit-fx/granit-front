import { evaluateMetric } from '@granit/analytics';
import { HttpError } from '@granit/api-client';
import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type Query, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { buildAnalyticsQueryKey } from './query-keys';

import type { MetricRequest, MetricResponse } from '@granit/analytics';

/** Root path where the analytics endpoints (`/metrics/*`) are mounted. */
export const ANALYTICS_BASE_PATH = '/api/v1/analytics';

const POLLING_INTERVAL_MS: Readonly<Record<MetricResponse['refreshHint'], number | false>> = {
  Static: false,
  Dynamic: false,
  Realtime: 5_000,
};

export interface UseMetricOptions {
  /** Disable the request — useful when the parent isn't ready (e.g. tenant pending). */
  readonly enabled?: boolean;
  /**
   * Force a polling interval, overriding the timing the response's
   * `refreshHint` would otherwise dictate. `false` disables polling entirely.
   * Once SSE subscriptions land (proposals doc P2.4), this option becomes
   * less relevant — the hook self-discriminates between polling, SSE, and
   * dashboard-multiplexed streams.
   */
  readonly refetchInterval?: number | false;
}

/**
 * Evaluates a `MetricDefinition` and returns a TanStack Query result.
 *
 * Cache key shape — `['analytics', 'metric', metricName, normalizedRequest]` —
 * IS the future subscription identity (see proposals doc, invariant on P2.4).
 * Any push transport will reuse the same composition to address subscriptions.
 *
 * The polling cadence is derived from the response's `refreshHint` on every
 * tick (TanStack v5 `refetchInterval` accepts a query-aware function), so a
 * `static` snapshot stops polling itself, a `dynamic` one stays cached, and a
 * `realtime` one polls until SSE replaces polling per P2.4.
 *
 * Retry policy: never retry on 4xx (the metric is unknown, the period spec is
 * malformed, or the tenant is forbidden — none of these recover by retrying).
 */
export function useMetric(
  metricName: string,
  request: MetricRequest,
  options: UseMetricOptions = {}
): UseQueryResult<MetricResponse> {
  const api = useGranitClient();
  const normalizedRequest = useMemo(() => normalizeMetricRequest(request), [request]);

  const queryKey = useMemo(
    () => buildAnalyticsQueryKey('metric', metricName, normalizedRequest),
    [metricName, normalizedRequest]
  );

  return useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      evaluateMetric(api, ANALYTICS_BASE_PATH, metricName, normalizedRequest, { signal }),
    enabled: options.enabled ?? true,
    retry: shouldRetry,
    staleTime: 60_000,
    refetchInterval: options.refetchInterval ?? refetchIntervalFromResponse,
  });
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  // 4xx are deterministic (bad request / not found / forbidden) — never retry.
  // The `@granit/api-client` interceptors normalize Axios errors to HttpError,
  // so we check that contract instead of importing axios directly.
  if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

function refetchIntervalFromResponse(
  query: Query<MetricResponse, Error, MetricResponse, readonly unknown[]>
): number | false {
  const data = query.state.data;
  if (!data) return false;
  return POLLING_INTERVAL_MS[data.refreshHint];
}

/**
 * Produces a canonical request shape so semantically-equivalent inputs collapse
 * to the same query key (and therefore the same cache entry, in-flight
 * request, and — once streaming lands — subscription identity).
 */
export function normalizeMetricRequest(request: MetricRequest): MetricRequest {
  const period =
    'token' in request.period
      ? { token: request.period.token }
      : { from: request.period.from, to: request.period.to };

  return request.compareTo ? { period, compareTo: { token: request.compareTo.token } } : { period };
}
