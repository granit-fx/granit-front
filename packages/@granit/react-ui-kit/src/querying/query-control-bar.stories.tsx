import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { QueryControlBar } from './query-control-bar';

import type { PagedResult, QueryMetadata } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

const BASE = '/api/v1/reference-data/countries';

interface Country {
  readonly code: string;
  readonly labelEn: string;
}

const ROWS: Country[] = [
  { code: 'FR', labelEn: 'France' },
  { code: 'DE', labelEn: 'Germany' },
  { code: 'JP', labelEn: 'Japan' },
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
  presetFilterGroups: [
    {
      name: 'status',
      label: 'Status',
      presets: [
        { name: 'active', label: 'Active', isDefault: true },
        { name: 'inactive', label: 'Inactive', isDefault: false },
      ],
    },
  ],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [{ name: 'region', type: 'String' }],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
};

const META_MINIMAL: QueryMetadata = {
  ...META,
  presetFilterGroups: [],
  groupByFields: [],
};

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

const pageHandler = http.get(BASE, () => {
  const body: PagedResult<Country> = { items: ROWS, totalCount: ROWS.length };
  return HttpResponse.json(body);
});

function Harness({ meta }: { readonly meta: QueryMetadata }) {
  const queryEndpoint = useQueryEndpoint<Country>({
    initialParams: { page: 1, pageSize: 20, sort: [{ field: 'labelEn', direction: 'asc' }] },
  });
  return <QueryControlBar meta={meta} queryEndpoint={queryEndpoint} recordLabel="countries" />;
}

const meta = {
  title: 'Admin Kit/Querying/QueryControlBar',
  // The stories render `Harness`, not `QueryControlBar` directly: the bar needs
  // a live `useQueryEndpoint` return, which cannot be expressed as a static arg.
  // The harness still requires `meta`, so a default lives here and each story
  // passes the fixture it wants through `render`.
  component: Harness,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: { handlers: [metaHandler, pageHandler] },
  },
  args: {
    meta: META,
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

/** Full bar — preset filters, sort selector, group-by selector, total count. */
export const Default: Story = {
  render: () => <Harness meta={META} />,
};

/** Minimal bar — no presets and no groupable fields, only sort + count. */
export const SortOnly: Story = {
  render: () => <Harness meta={META_MINIMAL} />,
};
