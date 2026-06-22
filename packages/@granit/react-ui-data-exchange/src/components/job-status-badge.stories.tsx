import { JobStatusBadge } from './job-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof JobStatusBadge> = {
  title: 'DataExchange/JobStatusBadge',
  component: JobStatusBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    status: {
      control: 'select',
      options: [
        'Created',
        'Previewed',
        'Mapped',
        'Executing',
        'Completed',
        'PartiallyCompleted',
        'Failed',
        'Cancelled',
        'Queued',
        'Exporting',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof JobStatusBadge>;

export const Completed: Story = { args: { status: 'Completed' } };
export const PartiallyCompleted: Story = { args: { status: 'PartiallyCompleted' } };
export const Failed: Story = { args: { status: 'Failed' } };
export const Cancelled: Story = { args: { status: 'Cancelled' } };
export const Executing: Story = { args: { status: 'Executing' } };
export const Queued: Story = { args: { status: 'Queued' } };

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <JobStatusBadge status="Created" />
      <JobStatusBadge status="Previewed" />
      <JobStatusBadge status="Mapped" />
      <JobStatusBadge status="Executing" />
      <JobStatusBadge status="Completed" />
      <JobStatusBadge status="PartiallyCompleted" />
      <JobStatusBadge status="Failed" />
      <JobStatusBadge status="Cancelled" />
      <JobStatusBadge status="Queued" />
      <JobStatusBadge status="Exporting" />
    </div>
  ),
};
