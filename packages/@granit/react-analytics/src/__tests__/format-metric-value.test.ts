import { describe, expect, it } from 'vitest';

import { formatDeltaRatio, formatMetricValue } from '../lib/format-metric-value';

import type { ValueKind } from '@granit/analytics';

const normalize = (s: string) => s.replace(/[\u0020\u00A0\u202F]+/g, ' ');

describe('formatMetricValue', () => {
  it('returns the fallback when the value is null', () => {
    expect(formatMetricValue({ value: null, valueKind: 'Count', locale: 'en-US' })).toBe('—');
  });

  it('returns a custom fallback when provided', () => {
    expect(
      formatMetricValue({ value: null, valueKind: 'Count', locale: 'en-US', fallback: 'N/A' })
    ).toBe('N/A');
  });

  it.each<{ kind: ValueKind; value: number; en: string; fr: string; currency?: string }>([
    { kind: 'Count', value: 1234, en: '1,234', fr: '1 234' },
    { kind: 'Currency', value: 12450.5, currency: 'EUR', en: '€12,450.50', fr: '12 450,50 €' },
    { kind: 'Percentage', value: 0.1507, en: '15.07%', fr: '15,07 %' },
    { kind: 'Number', value: 3.14159, en: '3.14', fr: '3,14' },
  ])('formats $kind=$value across en-US / fr-FR', ({ kind, value, en, fr, currency }) => {
    expect(
      normalize(formatMetricValue({ value, valueKind: kind, currency, locale: 'en-US' }))
    ).toBe(normalize(en));
    expect(
      normalize(formatMetricValue({ value, valueKind: kind, currency, locale: 'fr-FR' }))
    ).toBe(normalize(fr));
  });

  it('formats sub-minute durations as seconds', () => {
    expect(formatMetricValue({ value: 42, valueKind: 'Duration', locale: 'en-US' })).toBe('42s');
  });

  it('formats minute-and-second durations', () => {
    expect(formatMetricValue({ value: 125, valueKind: 'Duration', locale: 'en-US' })).toBe('2m 5s');
  });
});

describe('formatDeltaRatio', () => {
  it('always shows a sign', () => {
    expect(formatDeltaRatio(0.1428, 'en-US')).toBe('+14.28%');
    expect(formatDeltaRatio(-0.1428, 'en-US')).toBe('-14.28%');
  });

  it('returns the fallback when ratio is null', () => {
    expect(formatDeltaRatio(null, 'en-US')).toBe('—');
  });
});
