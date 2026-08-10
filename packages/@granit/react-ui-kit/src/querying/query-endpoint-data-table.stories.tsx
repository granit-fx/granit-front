import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { QueryEndpointDataTable } from './query-endpoint-data-table';

import type { DataTableColumnDef } from '../data-table/table-features';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

const BASE = '/api/v1/reference-data/countries';

interface Country {
  readonly code: string;
  readonly labelEn: string;
  readonly region: string;
}

const ROWS: Country[] = [
  { code: 'FR', labelEn: 'France', region: 'Europe' },
  { code: 'DE', labelEn: 'Germany', region: 'Europe' },
  { code: 'JP', labelEn: 'Japan', region: 'Asia' },
  { code: 'BR', labelEn: 'Brazil', region: 'Americas' },
  { code: 'CA', labelEn: 'Canada', region: 'Americas' },
];

const META: QueryMetadata = {
  columns: [
    {
      name: 'code',
      label: 'Code',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'labelEn',
      label: 'Name',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'region',
      label: 'Region',
      type: 'String',
      order: 2,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [],
  sortableFields: [{ name: 'code' }, { name: 'labelEn' }],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
};

const columns: DataTableColumnDef<Country, unknown>[] = [
  { id: 'code', accessorKey: 'code', header: 'Code', enableSorting: true },
  { id: 'labelEn', accessorKey: 'labelEn', header: 'Name', enableSorting: true },
  { id: 'region', accessorKey: 'region', header: 'Region' },
];

const mockApiClient = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

const metaHandler = http.get(`${BASE}/meta`, () => HttpResponse.json(META));

function pageHandler(rows: Country[]) {
  return http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const start = (page - 1) * pageSize;
    const body: PagedResult<Country> = {
      items: rows.slice(start, start + pageSize),
      totalCount: rows.length,
    };
    return HttpResponse.json(body);
  });
}

function Harness() {
  const queryEndpoint = useQueryEndpoint<Country>({
    initialParams: { page: 1, pageSize: 20, sort: [{ field: 'labelEn', direction: 'asc' }] },
  });
  return <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />;
}

// The story component is `Harness`, not `QueryEndpointDataTable` itself: the
// latter needs a live `useQueryEndpoint` return, which cannot be expressed as a
// static arg, so both stories below render the harness and vary only the MSW
// handlers. Binding `component` to the propless harness is what they actually
// render, and it keeps them free of `args` they would ignore. `QueryDataTable`
// carries the arg-driven autodocs for the underlying table.
const meta = {
  title: 'Admin Kit/Querying/QueryEndpointDataTable',
  component: Harness,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={makeQueryClient()}>
        <GranitClientProvider client={mockApiClient}>
          <QueryProvider config={{ basePath: BASE, client: mockApiClient }}>
            <div className="w-[42rem]">
              <Story />
            </div>
          </QueryProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Live endpoint — fetches a page of countries through `useQueryEndpoint`. */
export const Default: Story = {
  parameters: {
    msw: { handlers: [metaHandler, pageHandler(ROWS)] },
  },
  render: () => <Harness />,
};

/** Empty endpoint — the data table renders its empty-state row. */
export const Empty: Story = {
  parameters: {
    msw: { handlers: [metaHandler, pageHandler([])] },
  },
  render: () => <Harness />,
};
