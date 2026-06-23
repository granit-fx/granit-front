import { createApiClient } from '@granit/api-client';
import { SubscriptionsProvider } from '@granit/react-subscriptions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { ArchivePlanDialog } from './archive-plan-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof ArchivePlanDialog> = {
  title: 'Features/Subscriptions/ArchivePlanDialog',
  component: ArchivePlanDialog,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <SubscriptionsProvider config={{ client, basePath: '/api/v1/subscriptions' }}>
          <Story />
        </SubscriptionsProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    planId: 'plan-002',
    planName: 'Professional',
    open: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
