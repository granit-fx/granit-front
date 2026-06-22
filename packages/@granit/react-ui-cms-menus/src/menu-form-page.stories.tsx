import { createApiClient } from '@granit/api-client';
import { CmsProvider } from '@granit/react-cms';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { MenuFormPage } from './menu-form-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof MenuFormPage> = {
  title: 'CMS Menus/MenuFormPage',
  component: MenuFormPage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <CmsProvider config={{ client, basePath: '/api/cms' }}>
          <MemoryRouter initialEntries={['/cms/sites/site-1/menus/new']}>
            <Routes>
              <Route path="/cms/sites/:id/menus/new" element={<Story />} />
            </Routes>
          </MemoryRouter>
        </CmsProvider>
      </QueryClientProvider>
    ),
  ],
};

export const Edit: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <CmsProvider config={{ client, basePath: '/api/cms' }}>
          <MemoryRouter initialEntries={['/cms/sites/site-1/menus/menu-1/edit']}>
            <Routes>
              <Route path="/cms/sites/:id/menus/:menuId/edit" element={<Story />} />
            </Routes>
          </MemoryRouter>
        </CmsProvider>
      </QueryClientProvider>
    ),
  ],
};
