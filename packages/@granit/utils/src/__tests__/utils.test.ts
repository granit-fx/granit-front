import { describe, expect, it } from 'vitest';

import { calculatePercentage, cn, formatDateTime, formatNumber } from '../index.ts';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('a', false, 'c')).toBe('a c');
  });

  it('resolves Tailwind class conflicts', () => {
    // tailwind-merge removes the first conflicting class
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });
});

describe('formatNumber', () => {
  it('formats numbers with thousand separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('formats large numbers', () => {
    expect(formatNumber(1_234_567)).toBe('1,234,567');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('accepts Intl.NumberFormatOptions', () => {
    const result = formatNumber(1.5, { minimumFractionDigits: 2 });
    expect(result).toBe('1.50');
  });
});

describe('formatDateTime', () => {
  it('formats a date with time', () => {
    const date = new Date('2026-02-27T14:30:00');
    const result = formatDateTime(date);
    expect(result).toContain('2026');
    expect(result).toContain('14:30');
  });

  it('accepts a string date', () => {
    const result = formatDateTime('2026-01-01T00:00:00');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('calculatePercentage', () => {
  it('calculates percentage correctly', () => {
    expect(calculatePercentage(50, 200)).toBe(25);
  });

  it('rounds to the nearest integer', () => {
    expect(calculatePercentage(1, 3)).toBe(33);
  });

  it('returns 0 when total is 0', () => {
    expect(calculatePercentage(10, 0)).toBe(0);
  });

  it('returns 100 when value equals total', () => {
    expect(calculatePercentage(5, 5)).toBe(100);
  });
});
