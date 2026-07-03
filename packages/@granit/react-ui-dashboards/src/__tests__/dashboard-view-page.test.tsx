import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { DashboardViewPage } from '../components/dashboard-view-page';

import { renderDashboards } from './test-utils';

// The composer is exercised by its own suite; here we only assert the view
// page's read↔edit toggle wiring, so stub it to a marker.
vi.mock('../components/dashboard-composer', () => ({
  DashboardComposer: ({
    dashboardId,
    onExit,
  }: {
    readonly dashboardId: string;
    readonly onExit: () => void;
  }) => (
    <div data-slot="dashboard-composer" data-dashboard-id={dashboardId}>
      <button type="button" data-slot="composer-exit" onClick={onExit}>
        exit
      </button>
    </div>
  ),
}));

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
  RenderedDashboard: ({
    dashboardId,
    request,
  }: {
    readonly dashboardId: string;
    readonly request?: { readonly periodToken?: string };
  }) => (
    <div
      data-slot="rendered-dashboard"
      data-dashboard-id={dashboardId}
      data-period-token={request?.periodToken}
    />
  ),
  // Context + selector are covered by their own suites; here they only need to
  // mount so the view page's wiring renders.
  DashboardContextProvider: ({ children }: { readonly children: React.ReactNode }) => children,
  DashboardTimeWindowToolbar: () => <div data-slot="dashboard-time-window-toolbar" />,
  useDashboardTimeWindowState: <T,>(initial: T) => [initial, vi.fn()] as const,
}));

describe('DashboardViewPage', () => {
  it('renders the dashboard chrome and the rendered surface once detail loads', () => {
    useDashboardDetail.mockReturnValue({ data: detail, isLoading: false });
    renderDashboards(<DashboardViewPage />);

    expect(document.querySelector('[data-slot="dashboard-view-page"]')).toBeInTheDocument();
    expect(screen.getByText('Invoicing overview')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="rendered-dashboard"]')).toBeInTheDocument();
  });

  it('mounts the time-window selector and feeds the resolved period to the render request', () => {
    useDashboardDetail.mockReturnValue({ data: detail, isLoading: false });
    renderDashboards(<DashboardViewPage />);

    expect(
      document.querySelector('[data-slot="dashboard-time-window-toolbar"]')
    ).toBeInTheDocument();
    // Seeded to Last 30 days → the render request echoes that token.
    expect(
      document.querySelector('[data-slot="rendered-dashboard"]')?.getAttribute('data-period-token')
    ).toBe('last_30d');
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

  it('toggles to the inline composer on Edit and back out on exit', () => {
    useDashboardDetail.mockReturnValue({ data: detail, isLoading: false });
    renderDashboards(<DashboardViewPage />);

    // Read mode first: rendered surface, no composer.
    expect(document.querySelector('[data-slot="rendered-dashboard"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="dashboard-composer"]')).not.toBeInTheDocument();

    fireEvent.click(document.querySelector('[data-slot="dashboard-view-edit-toggle"]')!);

    // Edit mode: composer mounted inline (same page, no navigation), read surface gone.
    const page = document.querySelector('[data-slot="dashboard-view-page"]');
    expect(page?.getAttribute('data-mode')).toBe('edit');
    expect(document.querySelector('[data-slot="dashboard-composer"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="rendered-dashboard"]')).not.toBeInTheDocument();

    // Exiting drops back to read mode in place.
    fireEvent.click(document.querySelector('[data-slot="composer-exit"]')!);
    expect(
      document.querySelector('[data-slot="dashboard-view-page"]')?.getAttribute('data-mode')
    ).toBe('view');
    expect(document.querySelector('[data-slot="rendered-dashboard"]')).toBeInTheDocument();
  });

  it('renders a not-found empty state when the dashboard is missing', () => {
    useDashboardDetail.mockReturnValue({ data: undefined, isLoading: false });
    renderDashboards(<DashboardViewPage />);

    expect(screen.getByText('Dashboard not found.')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="rendered-dashboard"]')).not.toBeInTheDocument();
  });
});
