import { createApiClient } from '@granit/api-client';
import { NotificationProvider } from '@granit/react-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { NotificationInbox } from './notification-inbox';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof NotificationInbox> = {
  title: 'Notifications/NotificationInbox',
  component: NotificationInbox,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationProvider config={{ apiClient: client, basePath: '/api/v1' }}>
            <Story />
          </NotificationProvider>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
