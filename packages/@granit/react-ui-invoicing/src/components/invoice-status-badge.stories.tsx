import { InvoiceStatusBadge } from './invoice-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof InvoiceStatusBadge> = {
  title: 'Features/Invoicing/InvoiceStatusBadge',
  component: InvoiceStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Draft', 'Open', 'Paid', 'Cancelled', 'Uncollectible'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = { args: { status: 'Draft' } };
export const Open: Story = { args: { status: 'Open' } };
export const Paid: Story = { args: { status: 'Paid' } };
export const Cancelled: Story = { args: { status: 'Cancelled' } };
export const Uncollectible: Story = { args: { status: 'Uncollectible' } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <InvoiceStatusBadge status="Draft" />
      <InvoiceStatusBadge status="Open" />
      <InvoiceStatusBadge status="Paid" />
      <InvoiceStatusBadge status="Cancelled" />
      <InvoiceStatusBadge status="Uncollectible" />
    </div>
  ),
};
