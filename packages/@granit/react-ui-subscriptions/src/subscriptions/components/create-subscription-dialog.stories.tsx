import { createApiClient } from '@granit/api-client';
import { SubscriptionsProvider } from '@granit/react-subscriptions';
import { mockPlans } from '@granit/react-subscriptions/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { CreateSubscriptionDialog } from './create-subscription-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    mutations: { retry: false },
  },
});

const client = createApiClient({ baseURL: '' });

// Seed `useActivePlans` so the plan select resolves synchronously rather than
// depending on MSW timing for the `/plans/active` query.
queryClient.setQueryData(['subscriptions', 'plans', 'active'], mockPlans);

const meta: Meta<typeof CreateSubscriptionDialog> = {
  title: 'Features/Subscriptions/CreateSubscriptionDialog',
  component: CreateSubscriptionDialog,
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
    open: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
