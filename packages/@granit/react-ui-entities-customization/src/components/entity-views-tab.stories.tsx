import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { EntityViewsTab } from './entity-views-tab';

import type { Meta, StoryObj } from '@storybook/react-vite';

const api = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const discovery = {
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
};

const views = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Active customers',
    description: 'Customers with an open balance',
    kind: 'list',
    visibility: 'Tenant',
    icon: null,
    state: {},
    isPinned: true,
    isDefault: true,
    isPersonalDefault: false,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'My leads',
    description: null,
    kind: 'kanban',
    visibility: 'Personal',
    icon: null,
    state: {},
    isPinned: false,
    isDefault: false,
    isPersonalDefault: true,
  },
];

const meta: Meta<typeof EntityViewsTab> = {
  title: 'Features/Customization/EntityViewsTab',
  component: EntityViewsTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        http.get('/api/v1/entities', () => HttpResponse.json(discovery)),
        http.get('/api/v1/entities/:entityName/views', () => HttpResponse.json(views)),
      ],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={api}>
          <Story />
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
