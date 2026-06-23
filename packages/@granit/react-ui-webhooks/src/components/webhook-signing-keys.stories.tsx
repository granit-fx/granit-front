import { createApiClient } from '@granit/api-client';
import { WebhooksProvider } from '@granit/react-webhooks';
import { createWebhooksHandlers } from '@granit/react-webhooks/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { WebhookSigningKeys } from './webhook-signing-keys';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof WebhookSigningKeys> = {
  title: 'Features/Webhooks/WebhookSigningKeys',
  component: WebhookSigningKeys,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: { handlers: createWebhooksHandlers('/api/v1/webhooks') },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <WebhooksProvider config={{ client, basePath: '/api/v1/webhooks' }}>
          <Story />
        </WebhooksProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Subscription with several signing keys (active + rotated).
export const WithKeys: Story = {
  args: { subscriptionId: 'ws-1', signingSecretHint: 'whsec_b46a****************5182' },
};

// Subscription without a persisted secret hint.
export const NoSecretHint: Story = {
  args: { subscriptionId: 'ws-1', signingSecretHint: null },
};
