import { createApiClient } from '@granit/api-client';
import { SubscriptionsProvider } from '@granit/react-subscriptions';
import { mockPlans } from '@granit/react-subscriptions/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { ChangePlanDialog } from './change-plan-dialog';

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

const meta: Meta<typeof ChangePlanDialog> = {
  title: 'Features/Subscriptions/ChangePlanDialog',
  component: ChangePlanDialog,
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
    subscriptionId: 'sub-001',
    currentPlanId: 'plan-001',
    open: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
