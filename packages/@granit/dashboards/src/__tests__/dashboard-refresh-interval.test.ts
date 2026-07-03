import { describe, expect, it } from 'vitest';

import {
  DASHBOARD_REFRESH_INTERVAL,
  toRefetchInterval,
} from '../types/dashboard-refresh-interval';

describe('toRefetchInterval', () => {
  it('disables refetching for "off"', () => {
    expect(toRefetchInterval('off')).toBe(false);
  });

  it('defers to the query default for "auto"', () => {
    expect(toRefetchInterval('auto')).toBeUndefined();
  });

  it('passes a fixed millisecond interval through', () => {
    expect(toRefetchInterval(DASHBOARD_REFRESH_INTERVAL.Sec30)).toBe(30_000);
    expect(toRefetchInterval(DASHBOARD_REFRESH_INTERVAL.Hour1)).toBe(3_600_000);
  });

  it('maps the preset sentinels', () => {
    expect(DASHBOARD_REFRESH_INTERVAL.Off).toBe('off');
    expect(DASHBOARD_REFRESH_INTERVAL.Auto).toBe('auto');
    expect(DASHBOARD_REFRESH_INTERVAL.Day1).toBe(86_400_000);
  });
});
