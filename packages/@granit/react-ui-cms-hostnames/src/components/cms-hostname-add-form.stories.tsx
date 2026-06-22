import { createApiClient } from '@granit/api-client';
import { CmsHostnamesProvider } from '@granit/react-cms-hostnames';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CmsHostnameAddForm } from './cms-hostname-add-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof CmsHostnameAddForm> = {
  title: 'CMS Hostnames/CmsHostnameAddForm',
  component: CmsHostnameAddForm,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <CmsHostnamesProvider config={{ client, basePath: '/api/cms' }}>
          <Story />
        </CmsHostnamesProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    siteId: 'b1f0c3a4-1d2e-4f5a-8b6c-1a2b3c4d5e6f',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
