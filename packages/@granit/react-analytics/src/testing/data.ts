import { toISODateString } from '@granit/types';
// ---------------------------------------------------------------------------
// @granit/react-analytics/testing — mock data
// ---------------------------------------------------------------------------

import type { MetricResponse } from '@granit/analytics';

const emittedAt = toISODateString(new Date().toISOString());

/** Mock metric envelopes keyed by metric name, served by `POST /metrics/{name}`. */
export const mockMetricResponses: Readonly<Record<string, MetricResponse>> = {
  revenue: {
    name: 'revenue',
    snapshot: {
      value: 124_500,
      valueKind: 'Currency',
      currency: 'EUR',
      isHigherBetter: true,
      noData: false,
      previous: { value: 110_000, deltaRatio: 0.1318, trend: 'up', isFavorable: true },
    },
    sequence: 1,
    emittedAt,
    refreshHint: 'Dynamic',
  },
  'active-users': {
    name: 'active-users',
    snapshot: {
      value: 842,
      valueKind: 'Count',
      currency: null,
      isHigherBetter: true,
      noData: false,
      previous: { value: 910, deltaRatio: -0.0747, trend: 'down', isFavorable: false },
    },
    sequence: 1,
    emittedAt,
    refreshHint: 'Realtime',
  },
  'conversion-rate': {
    name: 'conversion-rate',
    snapshot: {
      value: 0.184,
      valueKind: 'Percentage',
      currency: null,
      isHigherBetter: true,
      noData: false,
      previous: { value: 0.171, deltaRatio: 0.076, trend: 'up', isFavorable: true },
    },
    sequence: 1,
    emittedAt,
    refreshHint: 'Static',
  },
};

/**
 * Resolve a mock {@link MetricResponse} for the given name, falling back to a
 * `noData` envelope so unknown metrics render the empty state rather than 404.
 */
export function buildMockMetric(name: string): MetricResponse {
  return (
    mockMetricResponses[name] ?? {
      name,
      snapshot: {
        value: null,
        valueKind: 'Number',
        currency: null,
        isHigherBetter: true,
        noData: true,
        previous: null,
      },
      sequence: 1,
      emittedAt,
      refreshHint: 'Static',
    }
  );
}
