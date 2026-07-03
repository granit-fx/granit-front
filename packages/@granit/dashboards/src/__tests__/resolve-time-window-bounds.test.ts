import { toTimeZoneId } from '@granit/timing';
import { describe, expect, it } from 'vitest';

import { resolveTimeWindowBounds } from '../rendering/resolve-time-window-bounds';

import type { DashboardTimeWindow } from '../types/dashboard-time-window';

const NOW = new Date('2026-07-03T14:30:00.000Z');

function bounds(tw: DashboardTimeWindow, opts?: Parameters<typeof resolveTimeWindowBounds>[1]) {
  const b = resolveTimeWindowBounds(tw, opts);
  return b === null ? null : { from: b.from.toISOString(), to: b.to.toISOString() };
}

describe('resolveTimeWindowBounds', () => {
  it('returns an absolute range verbatim', () => {
    expect(
      bounds({ period: { from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' } })
    ).toEqual({ from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' });
  });

  it('delegates a token to the timing resolver (UTC by default)', () => {
    expect(bounds({ period: { token: 'last_7d' } }, { now: NOW })).toEqual({
      from: '2026-06-26T00:00:00.000Z',
      to: '2026-07-04T00:00:00.000Z',
    });
  });

  it('day-aligns a token in the supplied timezone', () => {
    // 2026-07-03T14:30Z is still 2026-07-03 in Los Angeles (UTC-7), so "today"
    // there runs 07:00Z → 07:00Z the next day.
    expect(
      bounds(
        { period: { token: 'today' } },
        { now: NOW, timeZone: toTimeZoneId('America/Los_Angeles') }
      )
    ).toEqual({ from: '2026-07-03T07:00:00.000Z', to: '2026-07-04T07:00:00.000Z' });
  });

  it('returns null for an unknown token', () => {
    expect(bounds({ period: { token: 'fortnight' } }, { now: NOW })).toBeNull();
  });
});
