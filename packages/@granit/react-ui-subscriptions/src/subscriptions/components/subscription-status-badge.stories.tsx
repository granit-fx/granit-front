import { SubscriptionStatusBadge } from './subscription-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof SubscriptionStatusBadge> = {
  title: 'Features/Subscriptions/SubscriptionStatusBadge',
  component: SubscriptionStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Trial', 'Active', 'PastDue', 'Suspended', 'Cancelled', 'Expired'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Trial: Story = { args: { status: 'Trial' } };
export const Active: Story = { args: { status: 'Active' } };
export const PastDue: Story = { args: { status: 'PastDue' } };
export const Suspended: Story = { args: { status: 'Suspended' } };
export const Cancelled: Story = { args: { status: 'Cancelled' } };
export const Expired: Story = { args: { status: 'Expired' } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <SubscriptionStatusBadge status="Trial" />
      <SubscriptionStatusBadge status="Active" />
      <SubscriptionStatusBadge status="PastDue" />
      <SubscriptionStatusBadge status="Suspended" />
      <SubscriptionStatusBadge status="Cancelled" />
      <SubscriptionStatusBadge status="Expired" />
    </div>
  ),
};
