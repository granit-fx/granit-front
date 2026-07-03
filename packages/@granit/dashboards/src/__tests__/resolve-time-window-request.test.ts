import { describe, expect, it } from 'vitest';

import { resolveTimeWindowToRenderRequest } from '../rendering/resolve-time-window-request';

import type { DashboardTimeWindow } from '../types/dashboard-time-window';

describe('resolveTimeWindowToRenderRequest', () => {
  it('emits a token window as { periodToken } alone (server is authoritative)', () => {
    // The bundle endpoint resolves the token server-side and ignores any
    // client-sent from/to, so we deliberately send no bounds — a phone in
    // another timezone must not pin the window to its own local day.
    const window: DashboardTimeWindow = { period: { token: 'mtd' } };
    expect(resolveTimeWindowToRenderRequest(window)).toEqual({ periodToken: 'mtd' });
  });

  it.each(['last_30d', 'wtd', 'today', 'last_1h', 'fortnight'])(
    'never computes bounds for the token %s',
    (token) => {
      expect(resolveTimeWindowToRenderRequest({ period: { token } })).toEqual({
        periodToken: token,
      });
    }
  );

  it('passes an absolute range through as periodFrom / periodTo', () => {
    const window: DashboardTimeWindow = {
      period: { from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' },
    };
    expect(resolveTimeWindowToRenderRequest(window)).toEqual({
      periodFrom: '2026-01-01T00:00:00.000Z',
      periodTo: '2026-02-01T00:00:00.000Z',
    });
  });
});
