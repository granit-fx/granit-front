// ---------------------------------------------------------------------------
// @granit/react-analytics/testing — MSW handlers mirroring the
// Granit.Analytics.Endpoints metric contract (/api/v1/analytics).
// ---------------------------------------------------------------------------

import { http, HttpResponse } from 'msw';

import { buildMockMetric } from './data';

import type { MetricResponse } from '@granit/analytics';

/**
 * Create MSW handlers for the analytics metric-evaluation endpoint
 * (`POST /metrics/{name}`), consumed by `useMetric`.
 *
 * @param baseUrl - API base path (default: `/api/v1/analytics`)
 * @param metrics - App-specific metric fixtures keyed by name; these take
 *   precedence over the built-in samples. Names not found in either resolve to
 *   a `noData` snapshot rather than 404.
 */
export function createAnalyticsHandlers(
  baseUrl = '/api/v1/analytics',
  metrics: Readonly<Record<string, MetricResponse>> = {}
) {
  return [
    http.post(`${baseUrl}/metrics/:name`, ({ params }) => {
      const name = params.name as string;
      return HttpResponse.json(metrics[name] ?? buildMockMetric(name));
    }),
  ];
}
