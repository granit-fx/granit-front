import { DASHBOARD_TIME_WINDOW } from '@granit/dashboards';
import { describe, expect, it } from 'vitest';

import { metricRequestFromTimeWindow } from '../lib/metric-request-from-time-window';

import type { DashboardTimeWindow } from '@granit/dashboards';

describe('metricRequestFromTimeWindow', () => {
  const withCompare: DashboardTimeWindow = {
    ...DASHBOARD_TIME_WINDOW.Last30Days,
    compareTo: { token: 'previous_period' },
  };

  it('forwards the comparison window when the metric supports a period', () => {
    expect(metricRequestFromTimeWindow(withCompare, true)).toEqual({
      period: { token: 'last_30d' },
      compareTo: { token: 'previous_period' },
    });
  });

  it('drops the comparison window for a period-less snapshot metric', () => {
    // The endpoint rejects a comparison on a metric with no PeriodSelector
    // (422 Granit.Analytics:ComparisonWithoutPeriodSelector) — never send it.
    expect(metricRequestFromTimeWindow(withCompare, false)).toEqual({
      period: { token: 'last_30d' },
    });
  });

  it('omits compareTo when the window declares none, even for a periodised metric', () => {
    expect(metricRequestFromTimeWindow(DASHBOARD_TIME_WINDOW.Last30Days, true)).toEqual({
      period: { token: 'last_30d' },
    });
  });

  it('re-brands an absolute range as ISO date strings', () => {
    const absolute: DashboardTimeWindow = {
      period: { from: '2026-01-01T00:00:00Z', to: '2026-02-01T00:00:00Z' },
    };
    expect(metricRequestFromTimeWindow(absolute, true)).toEqual({
      period: { from: '2026-01-01T00:00:00Z', to: '2026-02-01T00:00:00Z' },
    });
  });
});
