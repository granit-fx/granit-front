import { createApiClient } from '@granit/api-client';
import { HostnamesProvider } from '@granit/react-hostnames';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { AddHostnameDialog } from './hostname-add-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof AddHostnameDialog> = {
  title: 'Hostnames/AddHostnameDialog',
  component: AddHostnameDialog,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <HostnamesProvider config={{ client, basePath: '/api/v1/hostnames' }}>
          <Story />
        </HostnamesProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    open: true,
    onOpenChange: fn(),
    ownerType: 'tenant',
    ownerId: 'tnt_01HZ9KQX0000000000001',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
