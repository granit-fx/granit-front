import { describe, expect, it } from 'vitest';

import { resolveTimeWindowToRenderRequest } from '../rendering/resolve-time-window-request';

import type { DashboardTimeWindow } from '../types/dashboard-time-window';

// Fixed reference: 2026-07-03T14:30:00Z — a Friday, in Q3, month day 3.
const NOW = new Date('2026-07-03T14:30:00.000Z');
const END_OF_TODAY = '2026-07-04T00:00:00.000Z';

function resolve(token: string, opts?: { now?: Date; weekStartsOn?: 0 | 1 }) {
  const window: DashboardTimeWindow = { period: { token } };
  return resolveTimeWindowToRenderRequest(window, { now: NOW, ...opts });
}

describe('resolveTimeWindowToRenderRequest', () => {
  it('resolves a sub-day token as [now - duration, now)', () => {
    expect(resolve('last_1h')).toEqual({
      periodFrom: '2026-07-03T13:30:00.000Z',
      periodTo: '2026-07-03T14:30:00.000Z',
      periodToken: 'last_1h',
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
    expect(resolve(token)).toEqual({ periodFrom: from, periodTo: END_OF_TODAY, periodToken: token });
  });

  it.each([
    ['today', '2026-07-03T00:00:00.000Z', '2026-07-04T00:00:00.000Z'],
    ['yesterday', '2026-07-02T00:00:00.000Z', '2026-07-03T00:00:00.000Z'],
    ['day_before_yesterday', '2026-07-01T00:00:00.000Z', '2026-07-02T00:00:00.000Z'],
    ['this_day_last_week', '2026-06-26T00:00:00.000Z', '2026-06-27T00:00:00.000Z'],
  ])('resolves the single day %s', (token, from, to) => {
    expect(resolve(token)).toEqual({ periodFrom: from, periodTo: to, periodToken: token });
  });

  it.each([
    ['mtd', '2026-07-01T00:00:00.000Z'],
    ['qtd', '2026-07-01T00:00:00.000Z'],
    ['ytd', '2026-01-01T00:00:00.000Z'],
  ])('resolves the to-date token %s through the end of today', (token, from) => {
    expect(resolve(token)).toEqual({ periodFrom: from, periodTo: END_OF_TODAY, periodToken: token });
  });

  it.each([
    ['pm', '2026-06-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z'],
    ['pq', '2026-04-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z'],
    ['py', '2025-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'],
  ])('resolves the previous complete period %s', (token, from, to) => {
    expect(resolve(token)).toEqual({ periodFrom: from, periodTo: to, periodToken: token });
  });

  it('resolves wtd / pw against the configured first day of week', () => {
    // NOW is a Friday. Monday-start week began 2026-06-29; Sunday-start 2026-06-28.
    expect(resolve('wtd', { weekStartsOn: 1 }).periodFrom).toBe('2026-06-29T00:00:00.000Z');
    expect(resolve('wtd', { weekStartsOn: 0 }).periodFrom).toBe('2026-06-28T00:00:00.000Z');
    expect(resolve('pw', { weekStartsOn: 1 })).toEqual({
      periodFrom: '2026-06-22T00:00:00.000Z',
      periodTo: '2026-06-29T00:00:00.000Z',
      periodToken: 'pw',
    });
  });

  it('defaults the first day of week to Monday', () => {
    expect(resolve('wtd').periodFrom).toBe('2026-06-29T00:00:00.000Z');
  });

  it('clamps month arithmetic to the target month like .NET AddMonths', () => {
    // From May 31, last_3mo lands on "Feb 31" → clamped to Feb 28 (2026 is not leap).
    const window: DashboardTimeWindow = { period: { token: 'last_3mo' } };
    expect(
      resolveTimeWindowToRenderRequest(window, { now: new Date('2026-05-31T09:00:00.000Z') })
        .periodFrom
    ).toBe('2026-02-28T00:00:00.000Z');
  });

  it('passes an absolute range through unchanged (no token)', () => {
    const window: DashboardTimeWindow = {
      period: { from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' },
    };
    expect(resolveTimeWindowToRenderRequest(window, { now: NOW })).toEqual({
      periodFrom: '2026-01-01T00:00:00.000Z',
      periodTo: '2026-02-01T00:00:00.000Z',
    });
  });

  it('degrades an unresolvable token to an echo with no bounds', () => {
    expect(resolve('fortnight')).toEqual({ periodToken: 'fortnight' });
  });
});
