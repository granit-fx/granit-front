import type { MetricRequest } from '@granit/analytics';

/**
 * Query-key factory for analytics queries. The key shape
 * `['analytics', 'metric', name, request]` IS the future SSE subscription
 * identity (proposals doc P2.4) — don't change it without updating that
 * invariant comment in `useMetric`.
 */
export const analyticsKeys = {
  all: (): readonly string[] => ['analytics'],
  metric: (name: string, normalizedRequest: MetricRequest): readonly unknown[] => [
    'analytics',
    'metric',
    name,
    normalizedRequest,
  ],
} as const;
