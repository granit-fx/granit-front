import { DASHBOARD_TIME_WINDOW } from '@granit/dashboards';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardContextProvider } from '../components/dashboard-context';
import { DashboardTimeWindowToolbar } from '../components/dashboard-time-window-toolbar';

import type { DashboardTimeWindow } from '@granit/dashboards';

function Harness({
  initial = DASHBOARD_TIME_WINDOW.Last30Days,
  setTimeWindow,
}: {
  readonly initial?: DashboardTimeWindow;
  readonly setTimeWindow?: (w: DashboardTimeWindow | undefined) => void;
}) {
  const [timeWindow, setLocal] = useState<DashboardTimeWindow | undefined>(initial);
  return (
    <DashboardContextProvider
      value={{
        dashboardName: 'Test',
        timeWindow,
        setTimeWindow: (next) => {
          const resolved = typeof next === 'function' ? next(timeWindow) : next;
          setLocal(resolved);
          setTimeWindow?.(resolved);
        },
      }}
    >
      <DashboardTimeWindowToolbar />
    </DashboardContextProvider>
  );
}

describe('DashboardTimeWindowToolbar', () => {
  it('renders nothing outside a dashboard context', () => {
    const { container } = render(<DashboardTimeWindowToolbar />);
    expect(container.querySelector('[data-slot="dashboard-time-window-toolbar"]')).toBeNull();
  });

  it('renders nothing when the window is read-only (no setter)', () => {
    const { container } = render(
      <DashboardContextProvider
        value={{ dashboardName: 'Test', timeWindow: DASHBOARD_TIME_WINDOW.Last30Days }}
      >
        <DashboardTimeWindowToolbar />
      </DashboardContextProvider>
    );
    expect(container.querySelector('[data-slot="dashboard-time-window-toolbar"]')).toBeNull();
  });

  it('selects the preset matching the active token', () => {
    render(<Harness initial={DASHBOARD_TIME_WINDOW.Last7Days} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('last_7d');
  });

  it('propagates the chosen preset through setTimeWindow', () => {
    const onChange = vi.fn();
    render(<Harness initial={DASHBOARD_TIME_WINDOW.Last30Days} setTimeWindow={onChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mtd' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ period: { token: 'mtd' }, kind: 'History' })
    );
  });

  it('preserves an app-set compareTo across a period change', () => {
    const onChange = vi.fn();
    render(
      <Harness
        initial={{ ...DASHBOARD_TIME_WINDOW.Last30Days, compareTo: { token: 'previous_period' } }}
        setTimeWindow={onChange}
      />
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'last_7d' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        period: { token: 'last_7d' },
        compareTo: { token: 'previous_period' },
      })
    );
  });

  it('shows a disabled Custom entry for an absolute range not in the presets', () => {
    render(
      <Harness initial={{ period: { from: '2026-01-01T00:00:00Z', to: '2026-02-01T00:00:00Z' } }} />
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(screen.getByRole('option', { name: /custom range/i })).toBeDisabled();
  });
});
