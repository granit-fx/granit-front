import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { EntityActionDrawerHost, useEntityActionDrawer } from '@granit/react-entities';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { ActionDrawer } from './action-drawer';
import { EntityActionScopeProvider } from './entity-action-scope';

import type { EntityActionManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockApiClient = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

// ---------------------------------------------------------------------------
// MSW fixtures
// ---------------------------------------------------------------------------

const mockManifest = {
  schemaVersion: 1,
  identity: { labelKey: 'Entity.Label', pluralLabelKey: 'Entity.PluralLabel', icon: null },
  permissions: null,
  forms: [],
  details: [
    {
      name: 'default',
      sections: [
        {
          key: 'main',
          labelKey: null,
          order: 0,
          inheritsFromFormVariant: null,
          fields: ['Name', 'Status', 'CreatedAt'],
        },
      ],
      sidePanels: [],
    },
  ],
  collections: null,
  relations: null,
  actions: null,
  activities: null,
};

const mockEntityValues = {
  id: 'row-001',
  name: 'Alice Martin',
  status: 'Active',
  createdAt: '2024-01-15T10:30:00Z',
};

const entityManifestHandler = http.get('/api/v1/entities/:name', () =>
  HttpResponse.json(mockManifest)
);

const entityValuesHandler = http.get('/api/v1/:entityName/:id', () =>
  HttpResponse.json(mockEntityValues)
);

// ---------------------------------------------------------------------------
// Helper: action descriptors
// ---------------------------------------------------------------------------

function makeAction(overrides: Partial<EntityActionManifest> = {}): EntityActionManifest {
  return {
    name: 'view',
    kind: 'OpenDrawer',
    displayKey: null,
    icon: null,
    order: 0,
    urlTemplate: null,
    httpMethod: null,
    confirmationKey: null,
    workflowTransitionName: null,
    contributorAssemblyName: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Trigger component — opens the drawer immediately on mount so it renders
// open in Storybook without requiring a click.
// ---------------------------------------------------------------------------

interface DrawerTriggerProps {
  readonly action: EntityActionManifest;
  readonly rowId: string | null;
}

function DrawerOpener({ action, rowId }: DrawerTriggerProps) {
  const drawer = useEntityActionDrawer();
  return (
    <button
      type="button"
      className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
      onClick={() => drawer.open({ action, rowId, row: null })}
    >
      Open drawer
    </button>
  );
}

// ---------------------------------------------------------------------------
// Decorators
// ---------------------------------------------------------------------------

const withProviders = (Story: React.ComponentType) => (
  <QueryClientProvider client={queryClient}>
    <GranitClientProvider client={mockApiClient}>
      <EntityActionDrawerHost>
        <EntityActionScopeProvider>
          <Story />
        </EntityActionScopeProvider>
      </EntityActionDrawerHost>
    </GranitClientProvider>
  </QueryClientProvider>
);

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ActionDrawer> = {
  title: 'Shared Components/ActionDrawer',
  component: ActionDrawer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [entityManifestHandler, entityValuesHandler],
    },
  },
  decorators: [withProviders],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Closed state — the sheet is not visible until the button is clicked. */
export const Default: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-muted-foreground">
        Click the button to open the action drawer with entity detail content.
      </p>
      <DrawerOpener
        action={makeAction({ displayKey: null, name: 'View details' })}
        rowId="row-001"
      />
      <ActionDrawer />
    </div>
  ),
};

/** Drawer opened with a custom display key label. */
export const WithDisplayKey: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-muted-foreground">
        Drawer with a translated display key as the title.
      </p>
      <DrawerOpener
        action={makeAction({ name: 'view', displayKey: 'Actions.ViewDetails' })}
        rowId="row-001"
      />
      <ActionDrawer />
    </div>
  ),
};

/** URL-template variant — renders a sandboxed iframe for server-driven content. */
export const WithUrlTemplate: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-muted-foreground">
        Drawer using a URL template — content is loaded in a sandboxed iframe.
      </p>
      <DrawerOpener
        action={makeAction({
          name: 'import',
          displayKey: 'Actions.Import',
          urlTemplate: 'https://example.com/wizard?id={id}',
        })}
        rowId="row-001"
      />
      <ActionDrawer />
    </div>
  ),
};
