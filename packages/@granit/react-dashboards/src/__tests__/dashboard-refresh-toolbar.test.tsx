import { DASHBOARD_REFRESH_INTERVAL } from '@granit/dashboards';
import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardContextProvider } from '../components/dashboard-context';
import { DashboardRefreshToolbar } from '../components/dashboard-refresh-toolbar';

import type { DashboardRefreshInterval } from '@granit/dashboards';
import type { ReactNode } from 'react';

function withQuery(node: ReactNode) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>{node}</QueryClientProvider>
  );
}

function Harness({
  initial = DASHBOARD_REFRESH_INTERVAL.Auto,
  onChange,
  onRefresh,
}: {
  readonly initial?: DashboardRefreshInterval;
  readonly onChange?: (v: DashboardRefreshInterval | undefined) => void;
  readonly onRefresh?: () => void;
}) {
  const [refreshInterval, setLocal] = useState<DashboardRefreshInterval | undefined>(initial);
  return (
    <DashboardContextProvider
      value={{
        dashboardName: 'Test',
        refreshInterval,
        setRefreshInterval: (next) => {
          const resolved = typeof next === 'function' ? next(refreshInterval) : next;
          setLocal(resolved);
          onChange?.(resolved);
        },
      }}
    >
      <DashboardRefreshToolbar onRefresh={onRefresh} />
    </DashboardContextProvider>
  );
}

describe('DashboardRefreshToolbar', () => {
  it('renders nothing when the cadence is read-only (no setter)', () => {
    const { container } = render(
      withQuery(
        <DashboardContextProvider value={{ dashboardName: 'Test', refreshInterval: 'auto' }}>
          <DashboardRefreshToolbar />
        </DashboardContextProvider>
      )
    );
    expect(container.querySelector('[data-slot="dashboard-refresh-toolbar"]')).toBeNull();
  });

  it('selects the active cadence', () => {
    render(withQuery(<Harness initial={DASHBOARD_REFRESH_INTERVAL.Sec30} />));
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('30000');
  });

  it('propagates a chosen cadence through setRefreshInterval', () => {
    const onChange = vi.fn();
    render(withQuery(<Harness onChange={onChange} />));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '60000' } });
    expect(onChange).toHaveBeenCalledWith(60_000);
  });

  it('fires the manual refresh handler', () => {
    const onRefresh = vi.fn();
    render(withQuery(<Harness onRefresh={onRefresh} />));
    fireEvent.click(screen.getByRole('button'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
