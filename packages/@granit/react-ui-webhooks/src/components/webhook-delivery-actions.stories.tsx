import { mockWebhookDeliveryAttempts } from '@granit/react-webhooks/testing';

import { WebhookDeliveryActions } from './webhook-delivery-actions';

import type { Meta, StoryObj } from '@storybook/react-vite';

const failedDelivery = mockWebhookDeliveryAttempts.find((d) => !d.isSuccess)!;
const successDelivery = mockWebhookDeliveryAttempts.find((d) => d.isSuccess)!;

const meta: Meta<typeof WebhookDeliveryActions> = {
  title: 'Features/Webhooks/WebhookDeliveryActions',
  component: WebhookDeliveryActions,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    storePayload: { control: 'boolean' },
    onRetry: { action: 'onRetry' },
    onViewPayload: { action: 'onViewPayload' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FailedDelivery: Story = {
  args: {
    delivery: failedDelivery,
    onRetry: () => {},
    onViewPayload: () => {},
    storePayload: false,
  },
};

export const SuccessDelivery: Story = {
  args: {
    delivery: successDelivery,
    onRetry: () => {},
    onViewPayload: () => {},
    storePayload: false,
  },
};

export const WithPayload: Story = {
  args: {
    delivery: {
      ...successDelivery,
      payload: JSON.stringify({
        eventType: 'patient.created',
        timestamp: '2026-03-09T08:15:00Z',
        data: { patientId: 'p-123', name: 'Jean Dupont' },
      }),
    },
    onRetry: () => {},
    onViewPayload: () => {},
    storePayload: true,
  },
};
