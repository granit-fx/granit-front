import { createApiClient } from '@granit/api-client';
import { CmsProvider } from '@granit/react-cms';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { mockPageTree, mockSites } from '../testing';

import { PageTreePage } from './page-tree-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const site = mockSites[0]!;

const populatedHandlers = [
  http.get('/api/cms/pages/tree', () => HttpResponse.json(mockPageTree)),
  http.delete(/\/api\/cms\/pages\/[^/]+$/, () => new HttpResponse(null, { status: 204 })),
];

const emptyHandlers = [http.get('/api/cms/pages/tree', () => HttpResponse.json([]))];

const meta: Meta<typeof PageTreePage> = {
  title: 'CMS Pages/PageTreePage',
  component: PageTreePage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'padded',
    msw: { handlers: populatedHandlers },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <CmsProvider config={{ client, basePath: '' }}>
          <MemoryRouter initialEntries={[`/cms/sites/${site.id}/pages`]}>
            <Routes>
              <Route path="/cms/sites/:id/pages" element={<Story />} />
            </Routes>
          </MemoryRouter>
        </CmsProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PageTreePage>;

/** The site page tree rendered as an indented, flat table. */
export const Populated: Story = {};

/** Empty state: no pages exist yet under the site. */
export const Empty: Story = {
  parameters: { msw: { handlers: emptyHandlers } },
};
