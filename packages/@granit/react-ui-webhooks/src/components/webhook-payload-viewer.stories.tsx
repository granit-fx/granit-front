import { mockWebhookDeliveryAttempts } from '@granit/react-webhooks/testing';

import { WebhookPayloadViewer } from './webhook-payload-viewer';

import type { Meta, StoryObj } from '@storybook/react-vite';

const deliveryWithPayload = {
  ...mockWebhookDeliveryAttempts[0],
  payload: JSON.stringify({
    eventType: 'patient.created',
    timestamp: '2026-03-09T08:15:00Z',
    data: {
      patientId: 'p-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
    },
  }),
};

const meta: Meta<typeof WebhookPayloadViewer> = {
  title: 'Features/Webhooks/WebhookPayloadViewer',
  component: WebhookPayloadViewer,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    open: { control: 'boolean' },
    onOpenChange: { action: 'onOpenChange' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    delivery: deliveryWithPayload,
    open: true,
    onOpenChange: () => {},
  },
};

export const Closed: Story = {
  args: {
    delivery: deliveryWithPayload,
    open: false,
    onOpenChange: () => {},
  },
};

export const NoPayload: Story = {
  args: {
    delivery: {
      ...mockWebhookDeliveryAttempts[0],
      payload: null,
    },
    open: true,
    onOpenChange: () => {},
  },
};
