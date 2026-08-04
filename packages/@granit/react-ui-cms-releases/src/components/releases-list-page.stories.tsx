import { createApiClient } from '@granit/api-client';
import { CmsProvider } from '@granit/react-cms';
import { mockReleases } from '@granit/react-cms/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router';

import { ReleasesListPage } from './releases-list-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const siteId = mockReleases[0]!.siteId;

const paged = (items: typeof mockReleases) => ({
  items,
  totalCount: items.length,
  hasMore: false,
  nextCursor: null,
});

// `useReleasesMeta` only feeds the grid's `defaultSort`; a minimal payload suffices.
const metaHandler = http.get('/api/cms/releases/meta', () =>
  HttpResponse.json({
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
    defaultSort: '-createdAt',
  })
);

const populatedHandlers = [
  metaHandler,
  http.get('/api/cms/releases', () => HttpResponse.json(paged(mockReleases))),
  http.post(/\/api\/cms\/releases\/[^/]+\/publish$/, () =>
    HttpResponse.json({ ...mockReleases[0]!, status: 'Done' })
  ),
];

const emptyHandlers = [
  metaHandler,
  http.get('/api/cms/releases', () => HttpResponse.json(paged([]))),
];

const meta: Meta<typeof ReleasesListPage> = {
  title: 'CMS Releases/ReleasesListPage',
  component: ReleasesListPage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'padded',
    msw: { handlers: populatedHandlers },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <CmsProvider config={{ client, basePath: '/api/cms' }}>
          <MemoryRouter initialEntries={[`/cms/sites/${siteId}/releases`]}>
            <Routes>
              <Route path="/cms/sites/:id/releases" element={<Story />} />
            </Routes>
          </MemoryRouter>
        </CmsProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ReleasesListPage>;

/** A draft and a scheduled (Ready) release; the Ready row exposes the publish action. */
export const Populated: Story = {};

/** Empty state: no releases exist yet for the site. */
export const Empty: Story = {
  parameters: { msw: { handlers: emptyHandlers } },
};
