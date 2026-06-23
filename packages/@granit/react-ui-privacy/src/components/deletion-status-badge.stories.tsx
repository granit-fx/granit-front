import { DeletionStatusBadge } from './deletion-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof DeletionStatusBadge> = {
  title: 'Features/Privacy/DeletionStatusBadge',
  component: DeletionStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Deferred', 'Executed', 'Cancelled'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Deferred: Story = { args: { status: 'Deferred' } };
export const Executed: Story = { args: { status: 'Executed' } };
export const Cancelled: Story = { args: { status: 'Cancelled' } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <DeletionStatusBadge status="Deferred" />
      <DeletionStatusBadge status="Executed" />
      <DeletionStatusBadge status="Cancelled" />
    </div>
  ),
};
