import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { EntitiesCustomizationProvider } from '@granit/react-entities-customization';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { WorkspaceCustomizationTab } from './workspace-customization-tab';

import type { Meta, StoryObj } from '@storybook/react-vite';

const api = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const workspaceTree = {
  schemaVersion: 1,
  workspaces: [
    {
      name: 'Sales',
      displayKey: 'Workspaces:Sales',
      icon: 'briefcase',
      order: 0,
      isShell: false,
      sections: [
        {
          key: 'pipeline',
          displayKey: 'Workspaces:Sales.Pipeline',
          order: 0,
          collapsedByDefault: false,
          items: [
            {
              kind: 'Entity',
              order: 0,
              displayKey: 'Parties:Entity.Party',
              icon: null,
              entityName: 'Granit.Parties.Party',
              entityViewName: null,
              entityPresetOverlay: null,
              dashboardName: null,
              linkUrl: null,
              subWorkspaceName: null,
            },
          ],
        },
      ],
    },
  ],
};

const meta: Meta<typeof WorkspaceCustomizationTab> = {
  title: 'Features/Customization/WorkspaceCustomizationTab',
  component: WorkspaceCustomizationTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        http.get('/api/v1/workspaces', () => HttpResponse.json(workspaceTree)),
        http.get('/api/v1/workspaces/:name/customization', () =>
          HttpResponse.json({ workspaceName: 'Sales', deltas: [] })
        ),
      ],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={api}>
          <EntitiesCustomizationProvider config={{ client: api, apiBase: '/api/v1' }}>
            <Story />
          </EntitiesCustomizationProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
