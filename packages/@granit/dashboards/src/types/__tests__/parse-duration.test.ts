import { describe, expect, it } from 'vitest';

import { formatDurationFromMs, parseDurationToMs } from '../parse-duration.js';

describe('parseDurationToMs', () => {
  it('parses minute-precision durations', () => {
    expect(parseDurationToMs('00:01:00')).toBe(60_000);
    expect(parseDurationToMs('00:30:00')).toBe(30 * 60_000);
    expect(parseDurationToMs('01:00:00')).toBe(3_600_000);
  });

  it('parses day-prefixed durations', () => {
    expect(parseDurationToMs('1.00:00:00')).toBe(86_400_000);
    expect(parseDurationToMs('7.00:00:00')).toBe(7 * 86_400_000);
    expect(parseDurationToMs('1.02:30:00')).toBe(86_400_000 + 2 * 3_600_000 + 30 * 60_000);
  });

  it('parses fractional seconds (truncated to milliseconds)', () => {
    expect(parseDurationToMs('00:00:00.5000000')).toBe(500);
    expect(parseDurationToMs('00:00:00.123')).toBe(123);
    expect(parseDurationToMs('00:00:01.250')).toBe(1_250);
  });

  it('returns null for malformed inputs (no exception)', () => {
    expect(parseDurationToMs('garbage')).toBeNull();
    expect(parseDurationToMs('PT1M')).toBeNull(); // ISO-8601 duration is NOT supported (different format)
    expect(parseDurationToMs('')).toBeNull();
  });

  it('returns null for null / undefined inputs', () => {
    expect(parseDurationToMs(null)).toBeNull();
    expect(parseDurationToMs(undefined)).toBeNull();
  });
});

describe('formatDurationFromMs', () => {
  it('formats minute-aligned durations without a fractional component', () => {
    expect(formatDurationFromMs(60_000)).toBe('00:01:00');
    expect(formatDurationFromMs(3_600_000)).toBe('01:00:00');
  });

  it('emits the day-prefixed shape past 24h', () => {
    expect(formatDurationFromMs(86_400_000)).toBe('1.00:00:00');
    expect(formatDurationFromMs(86_400_000 + 2 * 3_600_000 + 30 * 60_000)).toBe('1.02:30:00');
  });

  it('emits the fractional component when sub-second precision is involved', () => {
    expect(formatDurationFromMs(500)).toBe('00:00:00.500');
    expect(formatDurationFromMs(1_250)).toBe('00:00:01.250');
  });

  it('returns null on negative or non-finite inputs', () => {
    expect(formatDurationFromMs(-1)).toBeNull();
    expect(formatDurationFromMs(Number.POSITIVE_INFINITY)).toBeNull();
    expect(formatDurationFromMs(Number.NaN)).toBeNull();
  });

  it('round-trips through parseDurationToMs', () => {
    for (const ms of [60_000, 86_400_000, 1_250, 500, 3_600_000 * 25]) {
      const formatted = formatDurationFromMs(ms);
      expect(formatted).not.toBeNull();
      expect(parseDurationToMs(formatted)).toBe(ms);
    }
  });
});
