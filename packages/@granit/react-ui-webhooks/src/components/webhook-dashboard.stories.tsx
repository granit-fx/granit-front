import { mockWebhookStats } from '@granit/react-webhooks/testing';

import { WebhookDashboard } from './webhook-dashboard';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof WebhookDashboard> = {
  title: 'Features/Webhooks/WebhookDashboard',
  component: WebhookDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    isLoading: { control: 'boolean' },
    stats: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    stats: mockWebhookStats,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    stats: undefined,
    isLoading: false,
  },
};

export const HighSuccessRate: Story = {
  args: {
    stats: {
      ...mockWebhookStats,
      successRateLast24h: 99.8,
    },
    isLoading: false,
  },
};

export const LowSuccessRate: Story = {
  args: {
    stats: {
      ...mockWebhookStats,
      successRateLast24h: 65.2,
    },
    isLoading: false,
  },
};
