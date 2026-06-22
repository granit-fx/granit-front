import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { DashboardListPage } from '../dashboard-list-page';

import { renderDashboards } from './test-utils';

vi.mock('@granit/react-dashboards', () => ({
  useDashboardCatalog: () => ({
    data: [
      {
        name: 'Granit.Showcase.InvoicingOverview',
        category: 'Finance',
        isSystem: false,
        version: '1.0.0',
        widgetCount: 4,
        hasViews: false,
        hasAliases: false,
        hasFilters: false,
      },
    ],
    isLoading: false,
  }),
  useDashboardList: () => ({
    data: {
      items: [
        {
          id: '8c6b1e10-0000-4000-8000-000000000001',
          name: 'Invoicing overview',
          category: 'Finance',
          status: 'Draft',
          isSystem: false,
          sourceDefinitionName: 'Granit.Showcase.InvoicingOverview',
          sourceDefinitionVersion: '1.0.0',
          widgetCount: 4,
        },
      ],
      totalCount: 1,
      page: 0,
      pageSize: 50,
    },
    isLoading: false,
  }),
  useImportDashboard: () => ({ mutate: vi.fn(), isPending: false }),
  usePublishDashboard: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveDashboard: () => ({ mutate: vi.fn(), isPending: false }),
  useRestoreDashboard: () => ({ mutate: vi.fn(), isPending: false }),
  useResyncDashboard: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('DashboardListPage', () => {
  it('renders the catalogue heading', () => {
    renderDashboards(<DashboardListPage />);
    expect(screen.getByText('Dashboards')).toBeInTheDocument();
  });

  it('lists each persisted dashboard returned by useDashboardList', () => {
    renderDashboards(<DashboardListPage />);
    expect(screen.getByText('Invoicing overview')).toBeInTheDocument();
  });

  it('exposes the data-slot for downstream styling / e2e selectors', () => {
    renderDashboards(<DashboardListPage />);
    expect(document.querySelector('[data-slot="dashboard-list-page"]')).toBeInTheDocument();
  });

  it('renders the status badge per row', () => {
    renderDashboards(<DashboardListPage />);
    const badge = document.querySelector('[data-slot="dashboard-status-badge"]');
    expect(badge?.textContent).toBe('Draft');
  });

  it('renders the import-from-catalog control populated with available definitions', () => {
    renderDashboards(<DashboardListPage />);
    const select = document.querySelector('[data-slot="dashboard-import-catalog-select"]');
    expect(
      select?.querySelector('option[value="Granit.Showcase.InvoicingOverview"]')
    ).not.toBeNull();
  });

  it('renders the publish button on Draft rows (lifecycle: Draft → Published)', () => {
    renderDashboards(<DashboardListPage />);
    expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
  });
});
