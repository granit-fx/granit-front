import { StatusBadge } from './dashboard-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof StatusBadge> = {
  title: 'Dashboards/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Draft', 'Published', 'Archived'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = { args: { status: 'Draft' } };
export const Published: Story = { args: { status: 'Published' } };
export const Archived: Story = { args: { status: 'Archived' } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="Draft" />
      <StatusBadge status="Published" />
      <StatusBadge status="Archived" />
    </div>
  ),
};
