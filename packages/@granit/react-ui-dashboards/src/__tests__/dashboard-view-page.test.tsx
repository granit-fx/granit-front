import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { DashboardViewPage } from '../dashboard-view-page';

import { renderDashboards } from './test-utils';

const detail = {
  id: '8c6b1e10-0000-4000-8000-000000000001',
  name: 'Invoicing overview',
  category: 'Finance',
  status: 'Published',
  layoutColumns: 12,
  layoutRowHeight: 80,
  widgets: [],
};

const useDashboardDetail = vi.fn();

vi.mock('@granit/react-dashboards', () => ({
  useDashboardDetail: (id: string) => useDashboardDetail(id),
  RenderedDashboard: ({ dashboardId }: { readonly dashboardId: string }) => (
    <div data-slot="rendered-dashboard" data-dashboard-id={dashboardId} />
  ),
}));

describe('DashboardViewPage', () => {
  it('renders the dashboard chrome and the rendered surface once detail loads', () => {
    useDashboardDetail.mockReturnValue({ data: detail, isLoading: false });
    renderDashboards(<DashboardViewPage />);

    expect(document.querySelector('[data-slot="dashboard-view-page"]')).toBeInTheDocument();
    expect(screen.getByText('Invoicing overview')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="rendered-dashboard"]')).toBeInTheDocument();
  });

  it('shows the status badge for the persisted dashboard', () => {
    useDashboardDetail.mockReturnValue({ data: detail, isLoading: false });
    renderDashboards(<DashboardViewPage />);

    const badge = document.querySelector('[data-slot="dashboard-status-badge"]');
    expect(badge?.textContent).toBe('Published');
  });

  it('exposes an Edit affordance back to the composer', () => {
    useDashboardDetail.mockReturnValue({ data: detail, isLoading: false });
    renderDashboards(<DashboardViewPage />);

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('renders a not-found empty state when the dashboard is missing', () => {
    useDashboardDetail.mockReturnValue({ data: undefined, isLoading: false });
    renderDashboards(<DashboardViewPage />);

    expect(screen.getByText('Dashboard not found.')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="rendered-dashboard"]')).not.toBeInTheDocument();
  });
});
