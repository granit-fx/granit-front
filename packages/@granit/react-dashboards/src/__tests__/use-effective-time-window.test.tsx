import { DASHBOARD_TIME_WINDOW, type DashboardTimeWindow } from '@granit/dashboards';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardContextProvider } from '../components/dashboard-context.js';
import { useEffectiveTimeWindow } from '../hooks/use-effective-time-window.js';

import type { ReactNode } from 'react';

describe('useEffectiveTimeWindow', () => {
  it('falls back to the framework default outside any provider', () => {
    const { result } = renderHook(() => useEffectiveTimeWindow());
    expect(result.current).toBe(DASHBOARD_TIME_WINDOW.Last30Days);
  });

  it('returns the dashboard timeWindow when the context provides one', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DashboardContextProvider
        value={{ dashboardName: 'Test', timeWindow: DASHBOARD_TIME_WINDOW.Last7Days }}
      >
        {children}
      </DashboardContextProvider>
    );
    const { result } = renderHook(() => useEffectiveTimeWindow(), { wrapper });
    expect(result.current).toBe(DASHBOARD_TIME_WINDOW.Last7Days);
  });

  it('prefers an explicit override over the dashboard timeWindow', () => {
    const override: DashboardTimeWindow = {
      period: { token: 'mtd' },
      kind: 'History',
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DashboardContextProvider
        value={{ dashboardName: 'Test', timeWindow: DASHBOARD_TIME_WINDOW.Last7Days }}
      >
        {children}
      </DashboardContextProvider>
    );
    const { result } = renderHook(() => useEffectiveTimeWindow(override), { wrapper });
    expect(result.current).toBe(override);
  });

  it('falls back to the framework default when the provider has no timeWindow', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DashboardContextProvider value={{ dashboardName: 'Test' }}>
        {children}
      </DashboardContextProvider>
    );
    const { result } = renderHook(() => useEffectiveTimeWindow(), { wrapper });
    expect(result.current).toBe(DASHBOARD_TIME_WINDOW.Last30Days);
  });
});
