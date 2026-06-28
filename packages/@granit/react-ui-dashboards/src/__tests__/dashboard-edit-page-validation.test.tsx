import { defaultWidgetRegistry, WidgetRegistryProvider } from '@granit/react-dashboards';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardEditPage } from '../dashboard-edit-page';

import { renderDashboards } from './test-utils';

import type * as ReactDashboards from '@granit/react-dashboards';
import type * as ReactRouterDom from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '8c6b1e10-0000-4000-8000-000000000002' }),
    useNavigate: () => vi.fn(),
  };
});

// A chart widget persisted with an empty queryName / groupBy — the kind of
// incomplete config that renders as `status: 'Error'` if it reaches the backend.
vi.mock('@granit/react-dashboards', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactDashboards>();
  return {
    ...actual,
    useDashboardDetail: () => ({
      data: {
        id: '8c6b1e10-0000-4000-8000-000000000002',
        name: 'Granit.Showcase.Incomplete',
        category: 'Finance',
        status: 'Draft',
        isSystem: false,
        sourceDefinitionName: 'Granit.Showcase.Incomplete',
        sourceDefinitionVersion: '1.0.0',
        layoutColumns: 12,
        layoutRowHeight: 80,
        widgets: [
          {
            id: '8c6b1e10-0000-0000-0000-000000000020',
            widgetType: 'Chart',
            position: 0,
            width: 6,
            height: 3,
            titleLocalizationKey: 'Widget:Granit.Showcase.Incomplete.Sales',
            metricName: null,
            queryName: '',
            configJson: JSON.stringify({
              queryName: '',
              groupBy: '',
              aggregation: 'Sum',
              field: null,
              chartType: 'Bar',
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

describe('DashboardEditPage — required-field gating', () => {
  it('flags incomplete widgets and disables Save', () => {
    renderDashboards(
      <WidgetRegistryProvider registries={[defaultWidgetRegistry]}>
        <DashboardEditPage />
      </WidgetRegistryProvider>
    );

    const hint = document.querySelector('[data-slot="dashboard-edit-incomplete-hint"]');
    expect(hint).toBeInTheDocument();
    expect(hint?.textContent).toMatch(/1 widget/);

    const save = screen.getByRole('button', { name: /save/i });
    expect(save).toBeDisabled();
  });
});
