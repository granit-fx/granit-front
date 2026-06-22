import { createApiClient } from '@granit/api-client';
import { CmsProvider } from '@granit/react-cms';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { MenusListPage } from './menus-list-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof MenusListPage> = {
  title: 'CMS Menus/MenusListPage',
  component: MenusListPage,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <CmsProvider config={{ client, basePath: '/api/cms' }}>
          <MemoryRouter initialEntries={['/cms/sites/site-1/menus']}>
            <Routes>
              <Route path="/cms/sites/:id/menus" element={<Story />} />
            </Routes>
          </MemoryRouter>
        </CmsProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
