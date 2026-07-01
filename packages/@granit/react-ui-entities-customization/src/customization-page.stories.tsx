import { createApiClient } from '@granit/api-client';
import { EntitiesCustomizationProvider } from '@granit/react-entities-customization';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';

import { CustomizationPage } from './customization-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof CustomizationPage> = {
  title: 'Features/Customization/CustomizationPage',
  component: CustomizationPage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'padded',
    msw: {
      // Permission: gates the page on `EntitiesCustomization.Customizations.Manage`.
      // The story grants it so the editor surface mounts.
      handlers: [
        http.get('/api/v1/authorization/permissions', () =>
          HttpResponse.json({
            permissions: ['EntitiesCustomization.Customizations.Manage'],
          })
        ),
        http.get('/api/v1/entities', () =>
          HttpResponse.json({
            schemaVersion: 1,
            modules: [
              {
                module: 'Parties',
                items: [
                  {
                    name: 'Granit.Parties.Party',
                    displayKey: 'Parties:Entity.Party',
                    icon: 'users',
                    permissionGroup: 'Parties.Parties',
                    links: { manifest: '/api/v1/entities/Granit.Parties.Party', list: null },
                  },
                ],
              },
            ],
          })
        ),
        // Workspace tree for the Workspaces tab picker.
        http.get('/workspaces', () =>
          HttpResponse.json({
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
          })
        ),
      ],
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <EntitiesCustomizationProvider config={{ client, apiBase: '/api/v1' }}>
            <Story />
          </EntitiesCustomizationProvider>
        </QueryClientProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CustomizationPage>;

export const Default: Story = {};
