import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { DashboardPage } from '../dashboard-page';

import { renderDashboards } from './test-utils';

// The three dashboard render surfaces (`Dashboard`, `RenderedDashboard`,
// `DashboardViewSwitcher`) each fetch their own data. Stub them so the test
// asserts only this page's own chrome (title, sections, manage link).
vi.mock('@granit/react-dashboards', () => ({
  Dashboard: () => <div data-testid="dashboard" />,
  RenderedDashboard: () => <div data-testid="rendered-dashboard" />,
  DashboardViewSwitcher: () => <div data-testid="dashboard-view-switcher" />,
}));

vi.mock('@granit/react-dashboards/testing', () => ({
  SAMPLE_FINANCE_DASHBOARD_ID: '8c6b1e10-0000-4000-8000-000000000001',
}));

describe('DashboardPage', () => {
  it('should render the dashboard title from the fixture name', () => {
    // The test i18n uses flat-key lookup, so `Dashboard:<name>` is not a known
    // key — the title falls back to the fixture name via `defaultValue`.
    renderDashboards(<DashboardPage />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Granit.Showcase.InvoicingOverview' })
    ).toBeInTheDocument();
  });

  it('should expose the page data-slot', () => {
    renderDashboards(<DashboardPage />);
    expect(document.querySelector('[data-slot="dashboard-page"]')).toBeInTheDocument();
  });

  it('should render the manage dashboards link', () => {
    renderDashboards(<DashboardPage />);
    const link = screen.getByRole('link', { name: /Manage dashboards/ });
    expect(link).toHaveAttribute('href', '/dashboards/manage');
  });

  it('should render the three comparison sections', () => {
    renderDashboards(<DashboardPage />);
    expect(
      document.querySelector('[data-slot="dashboard-definition-section"]')
    ).toBeInTheDocument();
    expect(document.querySelector('[data-slot="dashboard-bundle-section"]')).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="dashboard-multi-view-section"]')
    ).toBeInTheDocument();
  });

  it('should render all three dashboard render surfaces', () => {
    renderDashboards(<DashboardPage />);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.getAllByTestId('rendered-dashboard')).toHaveLength(2);
    expect(screen.getByTestId('dashboard-view-switcher')).toBeInTheDocument();
  });
});
