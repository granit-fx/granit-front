import { describe, expect, it } from 'vitest';

import { resolveTimeWindowToRenderRequest } from '../rendering/resolve-time-window-request';

import type { DashboardTimeWindow } from '../types/dashboard-time-window';

// Fixed reference instant: 2026-07-03T14:30:00Z (a Friday in Q3).
const NOW = new Date('2026-07-03T14:30:00.000Z');

describe('resolveTimeWindowToRenderRequest', () => {
  it('resolves a rolling-duration token to now-minus-duration bounds', () => {
    const window: DashboardTimeWindow = { period: { token: 'last_7d' } };
    expect(resolveTimeWindowToRenderRequest(window, NOW)).toEqual({
      periodFrom: '2026-06-26T14:30:00.000Z',
      periodTo: '2026-07-03T14:30:00.000Z',
      periodToken: 'last_7d',
    });
  });

  it('resolves mtd to the first of the current UTC month', () => {
    expect(resolveTimeWindowToRenderRequest({ period: { token: 'mtd' } }, NOW)).toEqual({
      periodFrom: '2026-07-01T00:00:00.000Z',
      periodTo: '2026-07-03T14:30:00.000Z',
      periodToken: 'mtd',
    });
  });

  it('resolves qtd to the first day of the current quarter', () => {
    expect(resolveTimeWindowToRenderRequest({ period: { token: 'qtd' } }, NOW).periodFrom).toBe(
      '2026-07-01T00:00:00.000Z'
    );
  });

  it('resolves ytd to Jan 1 of the current UTC year', () => {
    expect(resolveTimeWindowToRenderRequest({ period: { token: 'ytd' } }, NOW).periodFrom).toBe(
      '2026-01-01T00:00:00.000Z'
    );
  });

  it('passes an absolute range through unchanged (no token)', () => {
    const window: DashboardTimeWindow = {
      period: { from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' },
    };
    expect(resolveTimeWindowToRenderRequest(window, NOW)).toEqual({
      periodFrom: '2026-01-01T00:00:00.000Z',
      periodTo: '2026-02-01T00:00:00.000Z',
    });
  });

  it('degrades an unresolvable token to an echo with no bounds', () => {
    // The endpoint requires periodFrom/periodTo as a pair; emitting one alone is
    // a 400, so an unknown token renders unbounded with just the echo.
    expect(resolveTimeWindowToRenderRequest({ period: { token: 'fortnight' } }, NOW)).toEqual({
      periodToken: 'fortnight',
    });
  });
});
