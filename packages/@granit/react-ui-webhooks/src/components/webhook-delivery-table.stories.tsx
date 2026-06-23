import { createApiClient } from '@granit/api-client';
import { QueryProvider } from '@granit/react-query-engine';
import { createWebhooksHandlers } from '@granit/react-webhooks/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { buildDeliveriesQueryConfig } from '../constants';

import { WebhookDeliveryTable } from './webhook-delivery-table';

import type { Meta, StoryObj } from '@storybook/react-vite';

const SUBSCRIPTION_ID = 'ws-1';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof WebhookDeliveryTable> = {
  title: 'Features/Webhooks/WebhookDeliveryTable',
  component: WebhookDeliveryTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: { handlers: createWebhooksHandlers('/api/v1/webhooks') },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <QueryProvider config={{ ...buildDeliveriesQueryConfig(SUBSCRIPTION_ID), client }}>
          <Story />
        </QueryProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    subscriptionId: SUBSCRIPTION_ID,
    onRetry: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Payloads stored — the "view payload" action column is shown.
export const WithStoredPayload: Story = {
  args: { storePayload: true },
};

// Payloads not stored — the payload viewer action is hidden.
export const WithoutStoredPayload: Story = {
  args: { storePayload: false },
};
