import { createApiClient } from '@granit/api-client';
import { NotificationsProvider } from '@granit/react-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { NotificationPreferencesPanel } from './notification-preferences-panel';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta: Meta<typeof NotificationPreferencesPanel> = {
  title: 'Notifications/NotificationPreferencesPanel',
  component: NotificationPreferencesPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <NotificationsProvider config={{ apiClient: client, basePath: '/api/v1' }}>
          <Story />
        </NotificationsProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
