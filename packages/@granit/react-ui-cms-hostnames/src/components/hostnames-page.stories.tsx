import { createApiClient } from '@granit/api-client';
import { CmsHostnamesProvider } from '@granit/react-cms-hostnames';
import { CORPORATE_SITE_ID, createCmsHostnamesHandlers } from '@granit/react-cms-hostnames/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';

import { HostnamesPage } from './hostnames-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

// The page reads the site id from the `:id` route param (useParams) and drives the
// headless @granit/react-cms-hostnames hooks; MSW serves the list/add/verify/remove
// endpoints from the shared `mockHostnames` fixture.
const meta: Meta<typeof HostnamesPage> = {
  title: 'CMS Hostnames/HostnamesPage',
  component: HostnamesPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: { handlers: createCmsHostnamesHandlers('/api/cms') },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <CmsHostnamesProvider config={{ client, basePath: '/api/cms' }}>
          <MemoryRouter initialEntries={[`/cms/sites/${CORPORATE_SITE_ID}/hostnames`]}>
            <Routes>
              <Route path="/cms/sites/:id/hostnames" element={<Story />} />
            </Routes>
          </MemoryRouter>
        </CmsHostnamesProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
