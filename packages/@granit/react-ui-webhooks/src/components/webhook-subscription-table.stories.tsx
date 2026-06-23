import { createApiClient } from '@granit/api-client';
import { QueryProvider } from '@granit/react-query-engine';
import { createWebhooksHandlers } from '@granit/react-webhooks/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { SUBSCRIPTIONS_QUERY_CONFIG } from '../constants';

import { WebhookSubscriptionTable } from './webhook-subscription-table';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof WebhookSubscriptionTable> = {
  title: 'Features/Webhooks/WebhookSubscriptionTable',
  component: WebhookSubscriptionTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: { handlers: createWebhooksHandlers('/api/v1/webhooks') },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <QueryProvider config={{ ...SUBSCRIPTIONS_QUERY_CONFIG, client }}>
            <Story />
          </QueryProvider>
        </QueryClientProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
