import { TransactionStatusBadge } from './transaction-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof TransactionStatusBadge> = {
  title: 'Payments/TransactionStatusBadge',
  component: TransactionStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Created', 'RequiresAction', 'Processing', 'Succeeded', 'Failed', 'Canceled'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Created: Story = { args: { status: 'Created' } };
export const RequiresAction: Story = { args: { status: 'RequiresAction' } };
export const Processing: Story = { args: { status: 'Processing' } };
export const Succeeded: Story = { args: { status: 'Succeeded' } };
export const Failed: Story = { args: { status: 'Failed' } };
export const Canceled: Story = { args: { status: 'Canceled' } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <TransactionStatusBadge status="Created" />
      <TransactionStatusBadge status="RequiresAction" />
      <TransactionStatusBadge status="Processing" />
      <TransactionStatusBadge status="Succeeded" />
      <TransactionStatusBadge status="Failed" />
      <TransactionStatusBadge status="Canceled" />
    </div>
  ),
};
