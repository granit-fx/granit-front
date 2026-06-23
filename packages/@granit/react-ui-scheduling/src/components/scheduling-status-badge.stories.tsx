import { SchedulingStatusBadge } from './scheduling-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof SchedulingStatusBadge> = {
  title: 'Features/Scheduling/SchedulingStatusBadge',
  component: SchedulingStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Pending', 'Executed', 'Cancelled', 'Failed', 'Processing'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = { args: { status: 'Pending' } };
export const Executed: Story = { args: { status: 'Executed' } };
export const Cancelled: Story = { args: { status: 'Cancelled' } };
export const Failed: Story = { args: { status: 'Failed' } };
export const Processing: Story = { args: { status: 'Processing' } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <SchedulingStatusBadge status="Pending" />
      <SchedulingStatusBadge status="Executed" />
      <SchedulingStatusBadge status="Cancelled" />
      <SchedulingStatusBadge status="Failed" />
      <SchedulingStatusBadge status="Processing" />
    </div>
  ),
};
