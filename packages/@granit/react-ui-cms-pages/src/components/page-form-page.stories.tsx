import { createApiClient } from '@granit/api-client';
import { CmsProvider } from '@granit/react-cms';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router';

import { mockPageTree, mockSites } from '../testing';

import { PageFormPage } from './page-form-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const site = mockSites[0]!;
const aboutNode = mockPageTree[1]!;
const pageDetail = {
  ...aboutNode,
  siteId: site.id,
  kind: 'content',
  layoutKey: null,
  translations: [],
};

const handlers = [
  http.get('/api/cms/pages/tree', () => HttpResponse.json(mockPageTree)),
  http.get(`/api/cms/sites/${site.id}`, () => HttpResponse.json(site)),
  http.get(`/api/cms/pages/${aboutNode.id}`, () => HttpResponse.json(pageDetail)),
  http.post('/api/cms/pages', () => HttpResponse.json(pageDetail, { status: 201 })),
  http.put(`/api/cms/pages/${aboutNode.id}`, () => HttpResponse.json(pageDetail)),
];

const meta: Meta<typeof PageFormPage> = {
  title: 'CMS Pages/PageFormPage',
  component: PageFormPage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'padded',
    msw: { handlers },
  },
  decorators: [
    (Story, ctx) => (
      <QueryClientProvider client={queryClient}>
        <CmsProvider config={{ client, basePath: '' }}>
          <MemoryRouter initialEntries={[ctx.parameters.route as string]}>
            <Routes>
              <Route path="/cms/sites/:id/pages/new" element={<Story />} />
              <Route path="/cms/sites/:id/pages/:pageId/edit" element={<Story />} />
            </Routes>
          </MemoryRouter>
        </CmsProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PageFormPage>;

/** Create mode: slug + parent (from the page tree) + optional layout key. */
export const CreateMode: Story = {
  parameters: { route: `/cms/sites/${site.id}/pages/new` },
};

/**
 * Edit mode: rename the slug. Content editing is delegated to the renderer's
 * Puck editor — the "Edit content" button is disabled here because no
 * `VITE_CMS_RENDERER_URL` is set in Storybook.
 */
export const EditMode: Story = {
  parameters: { route: `/cms/sites/${site.id}/pages/${aboutNode.id}/edit` },
};
