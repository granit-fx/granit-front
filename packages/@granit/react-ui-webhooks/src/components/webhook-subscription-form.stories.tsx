import { createApiClient } from '@granit/api-client';
import { WebhooksProvider } from '@granit/react-webhooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { WebhookSubscriptionForm } from './webhook-subscription-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// Storybook stub client — `useEventTypes` needs a WebhooksProvider in context.
// The query fails silently (retry: false) and the form renders an empty
// event-type select, which is sufficient for the visual story.
const stubClient = createApiClient({ baseURL: '' });

const meta: Meta<typeof WebhookSubscriptionForm> = {
  title: 'Features/Webhooks/WebhookSubscriptionForm',
  component: WebhookSubscriptionForm,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <WebhooksProvider config={{ client: stubClient, basePath: '/api/v1/webhooks' }}>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </WebhooksProvider>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['create', 'edit'],
    },
    isPending: { control: 'boolean' },
    onSubmit: { action: 'onSubmit' },
    onCancel: { action: 'onCancel' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
  args: {
    mode: 'create',
    onSubmit: async () => {},
    onCancel: () => {},
  },
};

export const EditMode: Story = {
  args: {
    mode: 'edit',
    defaultValues: {
      targetUrl: 'https://api.partner-health.be/webhooks/patients',
      eventType: 'patient.created',
    },
    onSubmit: async () => {},
    onCancel: () => {},
  },
};

export const Pending: Story = {
  args: {
    mode: 'create',
    isPending: true,
    onSubmit: async () => {},
    onCancel: () => {},
  },
};
