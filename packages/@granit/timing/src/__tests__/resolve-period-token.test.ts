import { toTimeZoneId } from '@granit/types';
import { describe, expect, it } from 'vitest';

import { resolvePeriodToken } from '../resolve-period-token';

import type { Weekday } from '../weekday';

// Fixed reference: 2026-07-03T14:30:00Z — a Friday, in Q3, month day 3.
const NOW = new Date('2026-07-03T14:30:00.000Z');
const END_OF_TODAY = '2026-07-04T00:00:00.000Z';

function iso(bounds: { from: Date; to: Date } | null) {
  if (bounds === null) return null;
  return { from: bounds.from.toISOString(), to: bounds.to.toISOString() };
}

function resolve(token: string, opts?: { now?: Date; weekStartsOn?: Weekday; timeZone?: string }) {
  return iso(
    resolvePeriodToken(token, {
      now: NOW,
      ...opts,
      timeZone: opts?.timeZone ? toTimeZoneId(opts.timeZone) : undefined,
    })
  );
}

describe('resolvePeriodToken — UTC (no timezone, non-regression)', () => {
  it('resolves sub-day tokens as [now - duration, now)', () => {
    expect(resolve('last_60s')).toEqual({
      from: '2026-07-03T14:29:00.000Z',
      to: '2026-07-03T14:30:00.000Z',
    });
    expect(resolve('last_1h')).toEqual({
      from: '2026-07-03T13:30:00.000Z',
      to: '2026-07-03T14:30:00.000Z',
    });
  });

  it.each([
    ['last_2d', '2026-07-01T00:00:00.000Z'],
    ['last_7d', '2026-06-26T00:00:00.000Z'],
    ['last_30d', '2026-06-03T00:00:00.000Z'],
    ['last_3mo', '2026-04-03T00:00:00.000Z'],
    ['last_6mo', '2026-01-03T00:00:00.000Z'],
    ['last_1y', '2025-07-03T00:00:00.000Z'],
    ['last_5y', '2021-07-03T00:00:00.000Z'],
  ])('day-aligns %s through the end of today', (token, from) => {
    expect(resolve(token)).toEqual({ from, to: END_OF_TODAY });
  });

  it.each([
    ['today', '2026-07-03T00:00:00.000Z', '2026-07-04T00:00:00.000Z'],
    ['yesterday', '2026-07-02T00:00:00.000Z', '2026-07-03T00:00:00.000Z'],
    ['day_before_yesterday', '2026-07-01T00:00:00.000Z', '2026-07-02T00:00:00.000Z'],
    ['this_day_last_week', '2026-06-26T00:00:00.000Z', '2026-06-27T00:00:00.000Z'],
  ])('resolves the single day %s', (token, from, to) => {
    expect(resolve(token)).toEqual({ from, to });
  });

  it.each([
    ['mtd', '2026-07-01T00:00:00.000Z'],
    ['qtd', '2026-07-01T00:00:00.000Z'],
    ['ytd', '2026-01-01T00:00:00.000Z'],
  ])('resolves the to-date token %s through the end of today', (token, from) => {
    expect(resolve(token)).toEqual({ from, to: END_OF_TODAY });
  });

  it.each([
    ['pm', '2026-06-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z'],
    ['pq', '2026-04-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z'],
    ['py', '2025-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'],
  ])('resolves the previous complete period %s', (token, from, to) => {
    expect(resolve(token)).toEqual({ from, to });
  });

  it('returns null for an unknown token', () => {
    expect(resolve('fortnight')).toBeNull();
  });
});

describe('resolvePeriodToken — first day of week', () => {
  it('resolves wtd / pw against the configured first day of week', () => {
    // NOW is a Friday. Monday-start week began 2026-06-29; Sunday-start 2026-06-28.
    expect(resolve('wtd', { weekStartsOn: 1 })?.from).toBe('2026-06-29T00:00:00.000Z');
    expect(resolve('wtd', { weekStartsOn: 0 })?.from).toBe('2026-06-28T00:00:00.000Z');
    expect(resolve('pw', { weekStartsOn: 1 })).toEqual({
      from: '2026-06-22T00:00:00.000Z',
      to: '2026-06-29T00:00:00.000Z',
    });
  });

  it('defaults the first day of week to Monday', () => {
    expect(resolve('wtd')?.from).toBe('2026-06-29T00:00:00.000Z');
  });
});

describe('resolvePeriodToken — .NET AddMonths clamp', () => {
  it('clamps month arithmetic to the target month last day', () => {
    // From May 31, last_3mo lands on "Feb 31" → clamped to Feb 28 (2026 is not leap).
    expect(
      iso(resolvePeriodToken('last_3mo', { now: new Date('2026-05-31T09:00:00.000Z') }))?.from
    ).toBe('2026-02-28T00:00:00.000Z');
  });
});

describe('resolvePeriodToken — timezone-aware calendar alignment', () => {
  it('day-aligns in the local timezone, not UTC (Asia/Tokyo, evening UTC)', () => {
    // 2026-07-03T20:00Z is already 2026-07-04 05:00 in Tokyo (UTC+9), so the
    // local "today" is the 4th, offset nine hours behind UTC midnight.
    const now = new Date('2026-07-03T20:00:00.000Z');
    expect(iso(resolvePeriodToken('today', { now, timeZone: toTimeZoneId('Asia/Tokyo') }))).toEqual(
      { from: '2026-07-03T15:00:00.000Z', to: '2026-07-04T15:00:00.000Z' }
    );
    expect(
      iso(resolvePeriodToken('last_7d', { now, timeZone: toTimeZoneId('Asia/Tokyo') }))
    ).toEqual({ from: '2026-06-26T15:00:00.000Z', to: '2026-07-04T15:00:00.000Z' });
  });

  it('keeps sub-day rolling tokens timezone-independent', () => {
    const now = new Date('2026-07-03T20:00:00.000Z');
    expect(
      iso(resolvePeriodToken('last_1h', { now, timeZone: toTimeZoneId('Asia/Tokyo') }))
    ).toEqual({ from: '2026-07-03T19:00:00.000Z', to: '2026-07-03T20:00:00.000Z' });
  });
});

describe('resolvePeriodToken — DST transitions (Europe/Brussels)', () => {
  it('spans 23h across the spring-forward day', () => {
    // 2026-03-29: clocks jump 02:00 → 03:00. Local midnight is CET (+1); the
    // next local midnight is CEST (+2), so "today" is only 23 hours long.
    const now = new Date('2026-03-29T12:00:00.000Z');
    expect(
      iso(resolvePeriodToken('today', { now, timeZone: toTimeZoneId('Europe/Brussels') }))
    ).toEqual({ from: '2026-03-28T23:00:00.000Z', to: '2026-03-29T22:00:00.000Z' });
  });

  it('spans 25h across the fall-back day', () => {
    // 2026-10-25: clocks fall 03:00 → 02:00. Local midnight is CEST (+2); the
    // next local midnight is CET (+1), so "today" is 25 hours long.
    const now = new Date('2026-10-25T12:00:00.000Z');
    expect(
      iso(resolvePeriodToken('today', { now, timeZone: toTimeZoneId('Europe/Brussels') }))
    ).toEqual({ from: '2026-10-24T22:00:00.000Z', to: '2026-10-25T23:00:00.000Z' });
  });
});
