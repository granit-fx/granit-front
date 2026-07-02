// ---------------------------------------------------------------------------
// @granit/react-analytics/testing — MSW handlers mirroring the
// Granit.Analytics.Endpoints metric contract (/api/v1/analytics).
// ---------------------------------------------------------------------------

import { http, HttpResponse } from 'msw';

import { buildMockMetric, mockMetricCatalog } from './data';

import type { MetricCatalogEntryResponse, MetricResponse } from '@granit/analytics';

/**
 * Create MSW handlers for the analytics metric endpoints — catalogue
 * (`GET /metrics/catalog`, consumed by `useMetricCatalog`) and evaluation
 * (`POST /metrics/{name}`, consumed by `useMetric`).
 *
 * @param baseUrl - API base path (default: `/api/v1/analytics`)
 * @param metrics - App-specific metric fixtures keyed by name; these take
 *   precedence over the built-in samples. Names not found in either resolve to
 *   a `noData` snapshot rather than 404.
 * @param catalog - App-specific catalogue overriding the built-in sample.
 */
export function createAnalyticsHandlers(
  baseUrl = '/api/v1/analytics',
  metrics: Readonly<Record<string, MetricResponse>> = {},
  catalog: readonly MetricCatalogEntryResponse[] = mockMetricCatalog
) {
  return [
    // Registered before `/metrics/:name` so the literal `/catalog` path wins.
    http.get(`${baseUrl}/metrics/catalog`, () => HttpResponse.json(catalog)),
    http.post(`${baseUrl}/metrics/:name`, ({ params }) => {
      const name = params.name as string;
      return HttpResponse.json(metrics[name] ?? buildMockMetric(name));
    }),
  ];
}
