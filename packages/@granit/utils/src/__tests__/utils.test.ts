import { describe, expect, it } from 'vitest';

import {
  calculatePercentage,
  cn,
  formatDate,
  formatDateTime,
  formatNumber,
  formatTimeAgo,
} from '../index.ts';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('should handle conditional classes', () => {
    expect(cn('a', false, 'c')).toBe('a c');
  });

  it('should resolve Tailwind class conflicts', () => {
    // tailwind-merge removes the first conflicting class
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('should handle undefined and null inputs', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });
});

describe('formatNumber', () => {
  it('should format numbers with thousand separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('should format large numbers', () => {
    expect(formatNumber(1_234_567)).toBe('1,234,567');
  });

  it('should format zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should accept Intl.NumberFormatOptions', () => {
    const result = formatNumber(1.5, { minimumFractionDigits: 2 });
    expect(result).toBe('1.50');
  });
});

describe('formatDateTime', () => {
  it('should format a date with time', () => {
    const date = new Date('2026-02-27T14:30:00');
    const result = formatDateTime(date);
    expect(result).toContain('2026');
    expect(result).toContain('14:30');
  });

  it('should accept a string date', () => {
    const result = formatDateTime('2026-01-01T00:00:00');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should convert to the given timezone', () => {
    // 10:00 UTC → 11:00 CET (Europe/Brussels, UTC+1 in January)
    const result = formatDateTime('2026-01-15T10:00:00Z', 'Europe/Brussels');
    expect(result).toContain('11:00:00');
  });
});

describe('formatDate', () => {
  it('should format a Date object', () => {
    const result = formatDate(new Date('2026-02-27T00:00:00'));
    expect(result).toContain('2026');
    expect(result).toContain('27');
  });

  it('should format a string date', () => {
    const result = formatDate('2026-06-15');
    expect(typeof result).toBe('string');
    expect(result).toContain('2026');
  });

  it('should convert UTC date to the given timezone', () => {
    // 2026-01-01T03:00:00Z is still Dec 31 in New York (UTC-5)
    const result = formatDate('2026-01-01T03:00:00Z', 'America/New_York');
    expect(result).toMatch(/December 31/);
    expect(result).toContain('2025');
  });

  it('should accept a Date object with timezone', () => {
    const result = formatDate(new Date('2026-01-01T03:00:00Z'), 'America/New_York');
    expect(result).toMatch(/December 31/);
  });
});

describe('formatTimeAgo', () => {
  it('should return a relative time string', () => {
    const recent = new Date(Date.now() - 60_000); // 1 minute ago
    const result = formatTimeAgo(recent);
    expect(result).toContain('ago');
  });

  it('should accept a string date', () => {
    const result = formatTimeAgo('2020-01-01T00:00:00');
    expect(typeof result).toBe('string');
    expect(result).toContain('ago');
  });
});

describe('calculatePercentage', () => {
  it('should calculate percentage correctly', () => {
    expect(calculatePercentage(50, 200)).toBe(25);
  });

  it('should round to the nearest integer by default', () => {
    expect(calculatePercentage(1, 3)).toBe(33);
  });

  it('should return 0 when total is 0', () => {
    expect(calculatePercentage(10, 0)).toBe(0);
  });

  it('should return 100 when value equals total', () => {
    expect(calculatePercentage(5, 5)).toBe(100);
  });

  it('should support decimal precision', () => {
    expect(calculatePercentage(1, 3, 1)).toBe(33.3);
    expect(calculatePercentage(1, 3, 2)).toBe(33.33);
  });

  it('decimals=0 behaves like Math.round', () => {
    expect(calculatePercentage(2, 3, 0)).toBe(67);
  });
});
