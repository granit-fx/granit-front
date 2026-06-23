import { WebhookStatusBadge } from './webhook-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof WebhookStatusBadge> = {
  title: 'Features/Webhooks/WebhookStatusBadge',
  component: WebhookStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Active', 'Suspended', 'Deactivated'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = { args: { status: 'Active' } };
export const Suspended: Story = { args: { status: 'Suspended' } };
export const Deactivated: Story = { args: { status: 'Deactivated' } };

export const AllStatuses: Story = {
  render: () => (
    <div className="flex gap-2">
      <WebhookStatusBadge status="Active" />
      <WebhookStatusBadge status="Suspended" />
      <WebhookStatusBadge status="Deactivated" />
    </div>
  ),
};
