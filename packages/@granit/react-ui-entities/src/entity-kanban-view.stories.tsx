import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { QueryProvider } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { EntityKanbanView } from './entity-kanban-view';

import type { ExtendedEntityManifest } from './manifest-extensions';
import type { EntityFormFieldManifest, EntityKanbanLayoutManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockApiClient = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function field(propertyName: string, component: string): EntityFormFieldManifest {
  return {
    propertyName,
    clrTypeName: 'String',
    component,
    config: null,
    labelKey: null,
    helpKey: null,
    order: 0,
    readOnly: false,
    visibleIf: null,
    lookup: null,
    provenance: null,
  };
}

const layout: EntityKanbanLayoutManifest = {
  groupByPropertyName: 'Status',
  groupByClrTypeName: 'String',
  card: {
    titleProperty: 'Title',
    fields: [field('Assignee', 'text'), field('DueDate', 'date')],
    relations: [],
    actions: [],
  },
  columns: [
    { value: 'Todo', color: 'Gray', defaultState: 'Open' },
    { value: 'InProgress', color: 'Blue', defaultState: 'Open' },
    { value: 'Done', color: 'Green', defaultState: 'Open' },
  ],
};

const manifest = {
  schemaVersion: 1,
  identity: {
    name: 'Granit.Tasks.Task',
    entityClrType: 'Granit.Tasks.Task',
    displayKey: null,
    icon: null,
    permissionGroup: 'Tasks.Tasks',
    displayProperty: 'Title',
    subtitleProperty: null,
  },
  permissions: null,
  forms: null,
  details: null,
  collections: null,
  relations: null,
  actions: [],
  activities: null,
} as unknown as ExtendedEntityManifest;

const rows: readonly Readonly<Record<string, unknown>>[] = [
  {
    id: '1',
    title: 'Draft proposal',
    status: 'Todo',
    assignee: 'Ada',
    dueDate: '2024-07-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Review designs',
    status: 'Todo',
    assignee: 'Alan',
    dueDate: '2024-07-03T00:00:00Z',
  },
  {
    id: '3',
    title: 'Build prototype',
    status: 'InProgress',
    assignee: 'Grace',
    dueDate: '2024-07-10T00:00:00Z',
  },
  {
    id: '4',
    title: 'Ship release',
    status: 'Done',
    assignee: 'Linus',
    dueDate: '2024-06-20T00:00:00Z',
  },
];

const meta = {
  title: 'Layout/EntityKanbanView',
  component: EntityKanbanView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Manifest-driven kanban board. Buckets the injected `rows` into columns by the layout `groupByPropertyName`, renders title + body fields per card, and (when `canUpdate`) supports drag-and-drop column transitions via a PATCH to the entity endpoint.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={makeQueryClient()}>
        <GranitClientProvider client={mockApiClient}>
          <QueryProvider config={{ basePath: '/api/v1/entities/Granit.Tasks.Task' }}>
            <div className="bg-background p-6">
              <Story />
            </div>
          </QueryProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    entityName: 'Granit.Tasks.Task',
    manifest,
    layout,
    rows,
    locale: 'en-GB',
    onCardClick: fn(),
  },
} satisfies Meta<typeof EntityKanbanView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Read-only board — no drag-and-drop (user lacks update permission). */
export const ReadOnly: Story = {
  args: { canUpdate: false },
};

/** Editable board — cards are draggable between columns. */
export const Editable: Story = {
  args: { canUpdate: true },
};

/** Empty board — columns render with zero counts. */
export const Empty: Story = {
  args: { canUpdate: true, rows: [] },
};
