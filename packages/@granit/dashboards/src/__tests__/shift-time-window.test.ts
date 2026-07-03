import { toTimeZoneId } from '@granit/timing';
import { describe, expect, it } from 'vitest';

import { shiftTimeWindow, zoomOutTimeWindow } from '../rendering/shift-time-window';

import type { DashboardTimeWindow } from '../types/dashboard-time-window';

// A 7-day absolute window — deterministic, no `now` dependency.
const WEEK: DashboardTimeWindow = {
  period: { from: '2026-01-08T00:00:00.000Z', to: '2026-01-15T00:00:00.000Z' },
};

describe('shiftTimeWindow', () => {
  it('shifts back by one window length', () => {
    expect(shiftTimeWindow(WEEK, 'back').period).toEqual({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-08T00:00:00.000Z',
    });
  });

  it('shifts forward by one window length', () => {
    expect(shiftTimeWindow(WEEK, 'forward').period).toEqual({
      from: '2026-01-15T00:00:00.000Z',
      to: '2026-01-22T00:00:00.000Z',
    });
  });

  it('resolves a token window to absolute bounds before shifting', () => {
    const now = new Date('2026-07-03T14:30:00.000Z');
    // last_7d → [2026-06-26, 2026-07-04) (day-aligned). Back by 8 days.
    const shifted = shiftTimeWindow({ period: { token: 'last_7d' } }, 'back', { now });
    expect(shifted.period).toEqual({
      from: '2026-06-18T00:00:00.000Z',
      to: '2026-06-26T00:00:00.000Z',
    });
  });

  it('resolves a token window in the supplied timezone before shifting', () => {
    const now = new Date('2026-07-03T14:30:00.000Z');
    // last_7d in Los Angeles (UTC-7): [2026-06-26T07:00Z, 2026-07-04T07:00Z),
    // an 8-day span. Back by 8 days.
    const shifted = shiftTimeWindow({ period: { token: 'last_7d' } }, 'back', {
      now,
      timeZone: toTimeZoneId('America/Los_Angeles'),
    });
    expect(shifted.period).toEqual({
      from: '2026-06-18T07:00:00.000Z',
      to: '2026-06-26T07:00:00.000Z',
    });
  });

  it('preserves compareTo / kind', () => {
    const shifted = shiftTimeWindow(
      { ...WEEK, kind: 'History', compareTo: { token: 'previous_period' } },
      'forward'
    );
    expect(shifted.kind).toBe('History');
    expect(shifted.compareTo).toEqual({ token: 'previous_period' });
  });

  it('returns the window unchanged for an unresolvable token', () => {
    const window: DashboardTimeWindow = { period: { token: 'fortnight' } };
    expect(shiftTimeWindow(window, 'back')).toBe(window);
  });
});

describe('zoomOutTimeWindow', () => {
  it('doubles the span around the centre', () => {
    // 7-day window → expand by 3.5 days each side.
    expect(zoomOutTimeWindow(WEEK).period).toEqual({
      from: '2026-01-04T12:00:00.000Z',
      to: '2026-01-18T12:00:00.000Z',
    });
  });

  it('returns the window unchanged for an unresolvable token', () => {
    const window: DashboardTimeWindow = { period: { token: 'fortnight' } };
    expect(zoomOutTimeWindow(window)).toBe(window);
  });
});
