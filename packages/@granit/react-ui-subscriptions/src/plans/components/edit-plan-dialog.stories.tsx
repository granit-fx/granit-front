import { createApiClient } from '@granit/api-client';
import { SubscriptionsProvider } from '@granit/react-subscriptions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { EditPlanDialog } from './edit-plan-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof EditPlanDialog> = {
  title: 'Features/Subscriptions/EditPlanDialog',
  component: EditPlanDialog,
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
    defaultName: 'Professional',
    defaultDescription: 'For growing businesses with advanced features',
    defaultSortOrder: 1,
    open: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoDescription: Story = {
  args: {
    planId: 'plan-001',
    defaultName: 'Starter',
    defaultDescription: null,
    defaultSortOrder: 0,
  },
};
