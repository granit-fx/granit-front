import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';

import { ReferenceDataListPageShell } from './reference-data-list-page-shell';

import type { ReferenceDataEntry } from './types';
import type { QueryConfig, QueryMetadata } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';

const api = createApiClient({ baseURL: '' });

const STORYBOOK_BASE = '/api/v1/reference-data/__storybook__';

// Minimal, fully-formed query metadata so the shell renders its filter/table
// chrome without depending on a feature-specific mocked endpoint.
const queryMetadata: QueryMetadata = {
  columns: [],
  filterableFields: [],
  sortableFields: [],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10000,
    supportsCursor: false,
  },
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const QUERY_CONFIG: QueryConfig = {
  client: api,
  basePath: STORYBOOK_BASE,
};

const columns: ColumnDef<ReferenceDataEntry, unknown>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'labelEn', header: 'Label' },
];

const noopMutation = {
  mutateAsync: async () => undefined,
  isPending: false,
};

const meta: Meta<typeof ReferenceDataListPageShell> = {
  title: 'Features/ReferenceData/ReferenceDataListPageShell',
  component: ReferenceDataListPageShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        http.get(`${STORYBOOK_BASE}/meta`, () => HttpResponse.json(queryMetadata)),
        http.get(STORYBOOK_BASE, () =>
          HttpResponse.json({ items: [], totalCount: 0, hasMore: false })
        ),
      ],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={api}>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    i18nPrefix: 'Countries',
    basePath: '/countries',
    queryConfig: QUERY_CONFIG,
    exportDefinition: 'Showcase.CountryExport',
    importDefinition: 'Showcase.CountryImport',
    columns,
    deactivateMutation: noopMutation,
    updateMutation: noopMutation,
  },
};

export default meta;
type Story = StoryObj<typeof ReferenceDataListPageShell>;

export const Default: Story = {};
