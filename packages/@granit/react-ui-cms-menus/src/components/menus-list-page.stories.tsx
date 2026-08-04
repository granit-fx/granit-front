import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { CmsProvider } from '@granit/react-cms';
import { CORPORATE_SITE_ID, createMenusHandlers } from '@granit/react-cms/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router';

import { MenusListPage } from './menus-list-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const BASE_PATH = '/api/cms';
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const metaHandler = http.get(`${BASE_PATH}/menus/meta`, () =>
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
    defaultSort: 'key',
  })
);

const meta: Meta<typeof MenusListPage> = {
  title: 'CMS Menus/MenusListPage',
  component: MenusListPage,
  tags: ['autodocs'],
  parameters: {
    // The grid is server-driven (QueryEndpointDataTable); MSW serves the
    // `/menus` list + `/menus/meta` the hooks call.
    msw: { handlers: [metaHandler, ...createMenusHandlers(`${BASE_PATH}/menus`)] },
  },
  decorators: [
    (Story) => (
      <GranitClientProvider client={client}>
        <QueryClientProvider client={queryClient}>
          <CmsProvider config={{ client, basePath: BASE_PATH }}>
            <MemoryRouter initialEntries={[`/cms/sites/${CORPORATE_SITE_ID}/menus`]}>
              <Routes>
                <Route path="/cms/sites/:id/menus" element={<Story />} />
              </Routes>
            </MemoryRouter>
          </CmsProvider>
        </QueryClientProvider>
      </GranitClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Menus list — server-driven grid (filter/sort/pagination) over the CMS menus endpoint. */
export const Default: Story = {};
