import { describe, expect, it } from 'vitest';

import { formatAxisTick } from '../format/format-axis-tick';

const normalize = (s: string) => s.replace(/[\u0020\u00A0\u202F]+/g, ' ');

describe('formatAxisTick', () => {
  it('formats numbers with locale grouping', () => {
    const fmt = formatAxisTick({ locale: 'en-US' });
    expect(fmt(1234)).toBe('1,234');
  });

  it('formats currency with the chosen ISO 4217 code', () => {
    const fmt = formatAxisTick({ kind: 'currency', currency: 'EUR', locale: 'fr-FR' });
    expect(normalize(fmt(12450.5))).toBe('12 450,50 €');
  });

  it('throws when currency kind is requested without a currency code', () => {
    expect(() => formatAxisTick({ kind: 'currency' })).toThrow(/currency is required/);
  });

  it('formats percentage values', () => {
    const fmt = formatAxisTick({ kind: 'percent', locale: 'en-US' });
    expect(fmt(0.1507)).toBe('15.07%');
  });

  it('coerces string inputs to numbers', () => {
    const fmt = formatAxisTick({ locale: 'en-US' });
    expect(fmt('1234')).toBe('1,234');
  });

  it('formats time-of-day with a date input as Unix ms', () => {
    const fmt = formatAxisTick({ kind: 'time', locale: 'en-US' });
    const ts = Date.UTC(2026, 0, 15, 13, 5);
    // We don't assert the exact string because the runtime's TZ varies — just
    // confirm it produced an HH:MM-like shape.
    expect(fmt(ts)).toMatch(/\d{1,2}[:.]\d{2}/);
  });
});
