import { toISODateString } from '@granit/types';
import { describe, expect, it } from 'vitest';

import { normalizeMetricRequest } from '../hooks/use-metric';

import type { MetricRequest } from '@granit/analytics';

describe('normalizeMetricRequest', () => {
  it('keeps a token-based period intact', () => {
    const input: MetricRequest = { period: { token: 'last_30d' } };
    expect(normalizeMetricRequest(input)).toEqual({ period: { token: 'last_30d' } });
  });

  it('keeps a custom range intact', () => {
    const input: MetricRequest = {
      period: {
        from: toISODateString('2026-04-01T00:00:00Z'),
        to: toISODateString('2026-04-28T00:00:00Z'),
      },
    };
    expect(normalizeMetricRequest(input)).toEqual({
      period: {
        from: toISODateString('2026-04-01T00:00:00Z'),
        to: toISODateString('2026-04-28T00:00:00Z'),
      },
    });
  });

  it('drops an undefined compareTo so the cache key collapses', () => {
    const a: MetricRequest = { period: { token: 'last_30d' } };
    const b: MetricRequest = { period: { token: 'last_30d' }, compareTo: undefined };
    expect(JSON.stringify(normalizeMetricRequest(a))).toBe(
      JSON.stringify(normalizeMetricRequest(b))
    );
  });

  it('produces JSON-stable output regardless of input key order', () => {
    const a: MetricRequest = {
      period: { token: 'last_30d' },
      compareTo: { token: 'previous_period' },
    };
    const b: MetricRequest = {
      compareTo: { token: 'previous_period' },
      period: { token: 'last_30d' },
    };
    expect(JSON.stringify(normalizeMetricRequest(a))).toBe(
      JSON.stringify(normalizeMetricRequest(b))
    );
  });
});
