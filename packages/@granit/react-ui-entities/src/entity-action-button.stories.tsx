import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GranitClientProvider } from '@granit/react-api-client';
import { EntityActionDrawerHost, EntityActionModalHost } from '@granit/react-entities';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createApiClient } from '@granit/api-client';
import { http, HttpResponse } from 'msw';

import type { EntityActionManifest } from '@granit/entities';
import { EntityActionScopeProvider } from './entity-action-scope';

import { EntityActionButton } from './entity-action-button';

const mockApiClient = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof EntityActionButton> = {
  title: 'Shared Components/EntityActionButton',
  component: EntityActionButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.get(
          '/api/*',
          () =>
            new HttpResponse(new Blob(['id,name\n1,Test'], { type: 'text/csv' }), {
              headers: { 'Content-Disposition': 'attachment; filename="export.csv"' },
            })
        ),
        http.post('/api/*', () => HttpResponse.json({ success: true })),
        http.delete('/api/*', () => new HttpResponse(null, { status: 204 })),
      ],
    },
  },
  args: {
    entityId: 'entity-123',
    actionHandlers: {
      navigate: fn(),
      workflowTransition: fn(),
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={mockApiClient}>
          <EntityActionDrawerHost>
            <EntityActionModalHost>
              <EntityActionScopeProvider>
                <Story />
              </EntityActionScopeProvider>
            </EntityActionModalHost>
          </EntityActionDrawerHost>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseAction = {
  icon: null,
  order: 0,
  urlTemplate: null,
  httpMethod: null,
  confirmationKey: null,
  workflowTransitionName: null,
  contributorAssemblyName: null,
  displayKey: null,
} satisfies Partial<EntityActionManifest>;

export const Download: Story = {
  args: {
    action: {
      ...baseAction,
      name: 'ExportCsv',
      kind: 'Download',
      displayKey: null,
      urlTemplate: '/api/entities/items/{id}/export',
    } as EntityActionManifest,
  },
};

export const Navigate: Story = {
  args: {
    action: {
      ...baseAction,
      name: 'ViewDetails',
      kind: 'Navigate',
      urlTemplate: '/items/{id}',
    } as EntityActionManifest,
  },
};

export const WorkflowTransition: Story = {
  args: {
    action: {
      ...baseAction,
      name: 'Approve',
      kind: 'WorkflowTransition',
      workflowTransitionName: 'Approved',
    } as EntityActionManifest,
  },
};

export const OpenDrawer: Story = {
  args: {
    action: {
      ...baseAction,
      name: 'OpenSidePanel',
      kind: 'OpenDrawer',
    } as EntityActionManifest,
  },
};

export const OpenModal: Story = {
  args: {
    action: {
      ...baseAction,
      name: 'EditItem',
      kind: 'OpenModal',
    } as EntityActionManifest,
  },
};

export const ApiCallDestructive: Story = {
  args: {
    action: {
      ...baseAction,
      name: 'DeleteItem',
      kind: 'ApiCall',
      httpMethod: 'DELETE',
      urlTemplate: '/api/entities/items/{id}',
      confirmationKey: 'Entity.Action.Delete.Confirm',
    } as EntityActionManifest,
  },
};

export const ApiCallDefault: Story = {
  args: {
    action: {
      ...baseAction,
      name: 'ProcessItem',
      kind: 'ApiCall',
      httpMethod: 'POST',
      urlTemplate: '/api/entities/items/{id}/process',
    } as EntityActionManifest,
  },
};

export const WithDisplayKey: Story = {
  args: {
    action: {
      ...baseAction,
      name: 'ExportCsv',
      kind: 'Download',
      displayKey: 'Showcase:Admin:Entity.Action.ExportCsv',
      urlTemplate: '/api/entities/items/{id}/export',
    } as EntityActionManifest,
  },
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2 p-4">
      <EntityActionButton
        {...args}
        action={
          {
            ...baseAction,
            name: 'Download',
            kind: 'Download',
            displayKey: null,
            urlTemplate: '/api/{id}',
          } as EntityActionManifest
        }
      />
      <EntityActionButton
        {...args}
        action={
          {
            ...baseAction,
            name: 'Navigate',
            kind: 'Navigate',
            displayKey: null,
            urlTemplate: '/view/{id}',
          } as EntityActionManifest
        }
      />
      <EntityActionButton
        {...args}
        action={
          {
            ...baseAction,
            name: 'Transition',
            kind: 'WorkflowTransition',
            displayKey: null,
            workflowTransitionName: 'Active',
          } as EntityActionManifest
        }
      />
      <EntityActionButton
        {...args}
        action={
          {
            ...baseAction,
            name: 'Drawer',
            kind: 'OpenDrawer',
            displayKey: null,
          } as EntityActionManifest
        }
      />
      <EntityActionButton
        {...args}
        action={
          {
            ...baseAction,
            name: 'Modal',
            kind: 'OpenModal',
            displayKey: null,
          } as EntityActionManifest
        }
      />
      <EntityActionButton
        {...args}
        action={
          {
            ...baseAction,
            name: 'Delete',
            kind: 'ApiCall',
            httpMethod: 'DELETE',
            urlTemplate: '/api/{id}',
            confirmationKey: 'Confirm.Delete',
            displayKey: null,
          } as EntityActionManifest
        }
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
