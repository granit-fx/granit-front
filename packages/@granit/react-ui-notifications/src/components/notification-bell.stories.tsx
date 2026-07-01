import { createApiClient } from '@granit/api-client';
import { NotificationsProvider } from '@granit/react-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { NotificationBell } from './notification-bell';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof NotificationBell> = {
  title: 'Notifications/NotificationBell',
  component: NotificationBell,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationsProvider config={{ apiClient: client, basePath: '/api/v1' }}>
            <div className="flex items-center gap-4 p-8">
              <Story />
            </div>
          </NotificationsProvider>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
