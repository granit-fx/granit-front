import { createApiClient } from '@granit/api-client';
import { HostnamesProvider } from '@granit/react-hostnames';
import { mockHostnames } from '@granit/react-hostnames/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { RowActions } from './hostname-row-actions';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof RowActions> = {
  title: 'Hostnames/RowActions',
  component: RowActions,
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
};

export default meta;
type Story = StoryObj<typeof meta>;

// Secondary hostname — exposes the "set primary" action.
export const Secondary: Story = {
  args: { hostname: mockHostnames[1], canManage: true },
};

// Primary hostname — exposes the "clear primary" action.
export const Primary: Story = {
  args: { hostname: mockHostnames[0], canManage: true },
};
