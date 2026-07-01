import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import {
  createDashboardsHandlers,
  SAMPLE_FINANCE_DASHBOARD_ID,
} from '@granit/react-dashboards/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';

import { DashboardComposer } from './dashboard-composer';

import type { Meta, StoryObj } from '@storybook/react-vite';

// Base URL empty so the composer's Axios calls resolve to the module default
// base path (`/api/v1/dashboards`), which the mock handlers intercept.
const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof DashboardComposer> = {
  title: 'Dashboards/DashboardComposer',
  component: DashboardComposer,
  // Data-driven edit surface: excluded from the interaction test run (`!test`)
  // — it composes the analytics + map editor registries and the full render
  // pipeline, which the headless package already covers under test.
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createDashboardsHandlers() },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={client}>
          <MemoryRouter initialEntries={['/dashboards/manage']}>
            <div className="p-6">
              <Story />
            </div>
          </MemoryRouter>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The full composer loaded against the seeded Finance dashboard — free
 * drag/resize grid, hover toolbar, add-widget palette and per-widget config
 * drawer, all backed by the mock dashboards handlers.
 */
export const Default: Story = {
  args: {
    dashboardId: SAMPLE_FINANCE_DASHBOARD_ID,
    onExit: fn(),
  },
};
