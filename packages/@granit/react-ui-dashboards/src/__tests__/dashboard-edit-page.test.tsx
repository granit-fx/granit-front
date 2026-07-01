import { defaultWidgetRegistry, WidgetRegistryProvider } from '@granit/react-dashboards';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { DashboardEditPage } from '../components/dashboard-edit-page';

import { renderDashboards } from './test-utils';

import type * as ReactDashboards from '@granit/react-dashboards';
import type * as ReactRouterDom from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '8c6b1e10-0000-4000-8000-000000000001' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@granit/react-dashboards', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactDashboards>();
  return {
    ...actual,
    useDashboardDetail: () => ({
      data: {
        id: '8c6b1e10-0000-4000-8000-000000000001',
        name: 'Granit.Showcase.InvoicingOverview',
        category: 'Finance',
        status: 'Draft',
        isSystem: false,
        sourceDefinitionName: 'Granit.Showcase.InvoicingOverview',
        sourceDefinitionVersion: '1.0.0',
        layoutColumns: 12,
        layoutRowHeight: 80,
        widgets: [
          {
            id: '8c6b1e10-0000-0000-0000-000000000010',
            widgetType: 'Markdown',
            position: 0,
            width: 12,
            height: 1,
            titleLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.Banner',
            metricName: null,
            queryName: null,
            configJson: JSON.stringify({
              contentLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.Banner.Content',
            }),
            requiredPermission: null,
          },
        ],
      },
      isLoading: false,
    }),
    useUpdateDashboardMetadata: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAddWidget: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateWidget: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useRemoveWidget: () => ({ mutateAsync: vi.fn(), isPending: false }),
  };
});

describe('DashboardEditPage — rich composer', () => {
  it('renders the editor surface for the loaded dashboard', () => {
    renderDashboards(
      <WidgetRegistryProvider registries={[defaultWidgetRegistry]}>
        <DashboardEditPage />
      </WidgetRegistryProvider>
    );
    expect(document.querySelector('[data-slot="dashboard-edit-page"]')).toBeInTheDocument();
  });

  it('mounts an Add widget trigger that opens the palette dialog', () => {
    renderDashboards(
      <WidgetRegistryProvider registries={[defaultWidgetRegistry]}>
        <DashboardEditPage />
      </WidgetRegistryProvider>
    );
    // Palette now lives inside a dialog; the trigger is always present.
    expect(document.querySelector('[data-slot="dashboard-edit-add-trigger"]')).toBeInTheDocument();
  });

  it('renders the editable grid with one cell per widget bridged from the detail response', () => {
    renderDashboards(
      <WidgetRegistryProvider registries={[defaultWidgetRegistry]}>
        <DashboardEditPage />
      </WidgetRegistryProvider>
    );
    const cells = document.querySelectorAll('[data-slot="editable-dashboard-cell"]');
    expect(cells).toHaveLength(1);
    expect(cells[0]?.getAttribute('data-widget-slug')).toBe('Banner');
  });

  it('seeds the dashboard-name input from the loaded dashboard', () => {
    renderDashboards(
      <WidgetRegistryProvider registries={[defaultWidgetRegistry]}>
        <DashboardEditPage />
      </WidgetRegistryProvider>
    );
    const input = document.querySelector(
      '[data-slot="dashboard-name-input"]'
    ) as HTMLInputElement | null;
    expect(input?.value).toBe('Granit.Showcase.InvoicingOverview');
  });

  it('exposes the lifecycle status badge', () => {
    renderDashboards(
      <WidgetRegistryProvider registries={[defaultWidgetRegistry]}>
        <DashboardEditPage />
      </WidgetRegistryProvider>
    );
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
  });
});
