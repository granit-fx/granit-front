import { describe, expect, it } from 'vitest';

import { createChartValueFormatter } from '../format-chart-value';

describe('createChartValueFormatter', () => {
  it('applies the locale grouping to plain numbers', () => {
    const fr = createChartValueFormatter('fr-FR', null)(1234567);
    const en = createChartValueFormatter('en-US', null)(1234567);
    // fr-FR groups with a (narrow no-break) space, en-US with a comma — the
    // point is that neither is the raw ECharts default "1234567".
    expect(fr).not.toBe('1234567');
    expect(en).toBe('1,234,567');
    expect(fr).not.toBe(en);
  });

  it('renders currency buckets with the ISO symbol', () => {
    const formatted = createChartValueFormatter('en-US', 'EUR')(1234.5);
    expect(formatted).toContain('€');
    expect(formatted).toContain('1,234.50');
  });

  it('falls back to plain number formatting when no currency is set', () => {
    const formatted = createChartValueFormatter('en-US', undefined)(1234.5);
    expect(formatted).toBe('1,234.5');
  });
});
