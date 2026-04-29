import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { KpiTileView } from '../components/kpi-tile-view.js';

import type { MetricResponse } from '@granit/analytics';

function makeResponse(overrides: Partial<MetricResponse['snapshot']> = {}): MetricResponse {
  return {
    name: 'Test.Metric',
    sequence: 1,
    emittedAt: '2026-04-28T12:00:00Z',
    refreshHint: 'Dynamic',
    snapshot: {
      value: 12,
      valueKind: 'Count',
      currency: null,
      isHigherBetter: true,
      noData: false,
      previous: null,
      ...overrides,
    },
  };
}

describe('KpiTileView', () => {
  it('renders the title above the body', () => {
    render(<KpiTileView title="Unpaid invoices" data={undefined} isLoading error={null} />);
    expect(screen.getByText('Unpaid invoices')).toBeInTheDocument();
  });

  it('shows skeletons while loading and no data', () => {
    const { container } = render(<KpiTileView title="X" data={undefined} isLoading error={null} />);
    expect(container.querySelector('[data-slot="kpi-tile-skeleton"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="kpi-tile-value"]')).toBeNull();
  });

  it('renders the formatted value once data is available', () => {
    render(
      <KpiTileView
        title="X"
        data={makeResponse({ value: 1234 })}
        isLoading={false}
        error={null}
        locale="en-US"
      />
    );
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders an em dash when noData is true', () => {
    render(
      <KpiTileView
        title="X"
        data={makeResponse({ value: null, noData: true })}
        isLoading={false}
        error={null}
        locale="en-US"
      />
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('hides the delta when no previous payload', () => {
    const { container } = render(
      <KpiTileView title="X" data={makeResponse()} isLoading={false} error={null} locale="en-US" />
    );
    expect(container.querySelector('[data-slot="kpi-tile-delta"]')).toBeNull();
  });

  it('renders a favorable delta in the success colour', () => {
    const { container } = render(
      <KpiTileView
        title="X"
        data={makeResponse({
          value: 12,
          previous: { value: 14, deltaRatio: -0.1428, trend: 'down', isFavorable: true },
        })}
        isLoading={false}
        error={null}
        locale="en-US"
      />
    );
    const delta = container.querySelector('[data-slot="kpi-tile-delta"]');
    expect(delta).toHaveClass('text-success-600');
    expect(delta?.textContent).toContain('-14.28%');
  });

  it('renders an unfavorable delta in the destructive colour', () => {
    const { container } = render(
      <KpiTileView
        title="X"
        data={makeResponse({
          value: 18,
          previous: { value: 14, deltaRatio: 0.2857, trend: 'up', isFavorable: false },
        })}
        isLoading={false}
        error={null}
        locale="en-US"
      />
    );
    const delta = container.querySelector('[data-slot="kpi-tile-delta"]');
    expect(delta).toHaveClass('text-destructive');
  });

  it('invokes onRetry when the error retry button is clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const onRetry = vi.fn();
    render(
      <KpiTileView
        title="X"
        data={undefined}
        isLoading={false}
        error={new Error('boom')}
        onRetry={onRetry}
        errorTitle="Failed"
        errorRetryLabel="Try again"
      />
    );
    expect(screen.getByText('Failed')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders the trendVisual slot when provided', () => {
    const { container } = render(
      <KpiTileView
        title="X"
        data={makeResponse()}
        isLoading={false}
        error={null}
        trendVisual={<svg data-testid="sparkline" />}
      />
    );
    expect(container.querySelector('[data-slot="kpi-tile-trend"]')).toBeInTheDocument();
    expect(screen.getByTestId('sparkline')).toBeInTheDocument();
  });
});
