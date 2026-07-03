import { DASHBOARD_TIME_WINDOW } from '@granit/dashboards';
import { DashboardContextProvider } from '@granit/react-dashboards';
import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { DashboardRefreshControl } from '../components/dashboard-refresh-control';
import { DashboardTimeRangeControl } from '../components/dashboard-time-range-control';

import type { DashboardRefreshInterval, DashboardTimeWindow } from '@granit/dashboards';
import type { ReactNode } from 'react';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

function wrap(node: ReactNode) {
  return render(
    <I18nextProvider i18n={testI18n}>
      <QueryClientProvider client={createTestQueryClient()}>{node}</QueryClientProvider>
    </I18nextProvider>
  );
}

function TimeHarness({ onChange }: { readonly onChange?: (w: DashboardTimeWindow | undefined) => void }) {
  const [timeWindow, setLocal] = useState<DashboardTimeWindow | undefined>(
    DASHBOARD_TIME_WINDOW.Last24Hours
  );
  return (
    <DashboardContextProvider
      value={{
        dashboardName: 'Test',
        timeWindow,
        setTimeWindow: (next) => {
          const resolved = typeof next === 'function' ? next(timeWindow) : next;
          setLocal(resolved);
          onChange?.(resolved);
        },
      }}
    >
      <DashboardTimeRangeControl />
    </DashboardContextProvider>
  );
}

describe('DashboardTimeRangeControl', () => {
  it('renders the pill with the active range label', () => {
    wrap(<TimeHarness />);
    expect(document.querySelector('[data-slot="dashboard-time-range-control"]')).toBeInTheDocument();
    expect(screen.getByText('Last 24 hours')).toBeInTheDocument();
  });

  it('renders nothing when the window is read-only', () => {
    wrap(
      <DashboardContextProvider
        value={{ dashboardName: 'Test', timeWindow: DASHBOARD_TIME_WINDOW.Last24Hours }}
      >
        <DashboardTimeRangeControl />
      </DashboardContextProvider>
    );
    expect(document.querySelector('[data-slot="dashboard-time-range-control"]')).toBeNull();
  });

  it('shifts the window to an absolute range via the ← control', () => {
    const onChange = vi.fn();
    wrap(<TimeHarness onChange={onChange} />);
    fireEvent.click(document.querySelector('[data-slot="time-range-back"]')!);
    expect(onChange.mock.calls.at(-1)?.[0].period).toHaveProperty('from');
  });

  it('shows the resolved absolute range + timezone on hover (focus opens the tooltip)', async () => {
    wrap(<TimeHarness />);
    fireEvent.focus(document.querySelector('[data-slot="time-range-trigger"]')!);
    const tip = await screen.findByRole('tooltip');
    // The Grafana-style summary: from / to / timezone label.
    expect(tip).toHaveTextContent('to');
    expect(tip.textContent).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
  });
});

function RefreshHarness({ onChange }: { readonly onChange?: (v: DashboardRefreshInterval | undefined) => void }) {
  const [refreshInterval, setLocal] = useState<DashboardRefreshInterval | undefined>('auto');
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
      <DashboardRefreshControl />
    </DashboardContextProvider>
  );
}

describe('DashboardRefreshControl', () => {
  it('renders the pill', () => {
    wrap(<RefreshHarness />);
    expect(document.querySelector('[data-slot="dashboard-refresh-control"]')).toBeInTheDocument();
  });

  it('renders nothing when the cadence is read-only', () => {
    wrap(
      <DashboardContextProvider value={{ dashboardName: 'Test', refreshInterval: 'auto' }}>
        <DashboardRefreshControl />
      </DashboardContextProvider>
    );
    expect(document.querySelector('[data-slot="dashboard-refresh-control"]')).toBeNull();
  });

  it('fires the manual refresh handler', () => {
    const onRefresh = vi.fn();
    wrap(
      <DashboardContextProvider
        value={{ dashboardName: 'Test', refreshInterval: 'auto', setRefreshInterval: vi.fn() }}
      >
        <DashboardRefreshControl onRefresh={onRefresh} />
      </DashboardContextProvider>
    );
    fireEvent.click(document.querySelector('[data-slot="refresh-now"]')!);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
