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

  it('opens the custom-range inputs, seeded, for an absolute-range window', () => {
    render(
      <Harness initial={{ period: { from: '2026-01-01T00:00:00Z', to: '2026-02-01T00:00:00Z' } }} />
    );
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('__custom__');
    expect(document.querySelector('[data-slot="dashboard-time-window-custom"]')).toBeInTheDocument();
    // Seeded from the window (browser-local rendering of the UTC bounds).
    expect(
      (document.querySelector('[data-slot="dashboard-time-window-from"]') as HTMLInputElement).value
    ).not.toBe('');
  });

  it('reveals the custom inputs when "Custom range" is selected', () => {
    render(<Harness initial={DASHBOARD_TIME_WINDOW.Last30Days} />);
    expect(document.querySelector('[data-slot="dashboard-time-window-custom"]')).toBeNull();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '__custom__' } });
    expect(document.querySelector('[data-slot="dashboard-time-window-custom"]')).toBeInTheDocument();
  });

  it('applies a valid absolute range as an absolute-period window', () => {
    const onChange = vi.fn();
    render(<Harness initial={DASHBOARD_TIME_WINDOW.Last30Days} setTimeWindow={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '__custom__' } });

    fireEvent.change(document.querySelector('[data-slot="dashboard-time-window-from"]')!, {
      target: { value: '2026-01-01T00:00' },
    });
    fireEvent.change(document.querySelector('[data-slot="dashboard-time-window-to"]')!, {
      target: { value: '2026-02-01T00:00' },
    });
    fireEvent.click(document.querySelector('[data-slot="dashboard-time-window-apply"]')!);

    const applied = onChange.mock.calls.at(-1)?.[0];
    expect(applied.period).toHaveProperty('from');
    expect(applied.period).toHaveProperty('to');
    expect(new Date(applied.period.from).getTime()).toBeLessThan(
      new Date(applied.period.to).getTime()
    );
  });

  it('shifts the window to an absolute range via the ← / → controls', () => {
    const onChange = vi.fn();
    render(<Harness initial={DASHBOARD_TIME_WINDOW.Last7Days} setTimeWindow={onChange} />);

    fireEvent.click(document.querySelector('[data-slot="dashboard-time-window-back"]')!);
    const shifted = onChange.mock.calls.at(-1)?.[0];
    expect(shifted.period).toHaveProperty('from');
    expect(shifted.period).toHaveProperty('to');
  });

  it('zooms out to a wider absolute range', () => {
    const onChange = vi.fn();
    render(
      <Harness
        initial={{ period: { from: '2026-01-08T00:00:00Z', to: '2026-01-15T00:00:00Z' } }}
        setTimeWindow={onChange}
      />
    );
    fireEvent.click(document.querySelector('[data-slot="dashboard-time-window-zoom-out"]')!);
    const zoomed = onChange.mock.calls.at(-1)?.[0];
    expect(new Date(zoomed.period.from).getTime()).toBeLessThan(
      new Date('2026-01-08T00:00:00Z').getTime()
    );
    expect(new Date(zoomed.period.to).getTime()).toBeGreaterThan(
      new Date('2026-01-15T00:00:00Z').getTime()
    );
  });

  it('disables Apply for an inverted or incomplete range', () => {
    render(<Harness initial={DASHBOARD_TIME_WINDOW.Last30Days} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '__custom__' } });
    // Both empty → disabled.
    expect(document.querySelector('[data-slot="dashboard-time-window-apply"]')).toBeDisabled();
    fireEvent.change(document.querySelector('[data-slot="dashboard-time-window-from"]')!, {
      target: { value: '2026-02-01T00:00' },
    });
    fireEvent.change(document.querySelector('[data-slot="dashboard-time-window-to"]')!, {
      target: { value: '2026-01-01T00:00' },
    });
    // from > to → still disabled.
    expect(document.querySelector('[data-slot="dashboard-time-window-apply"]')).toBeDisabled();
  });
});
