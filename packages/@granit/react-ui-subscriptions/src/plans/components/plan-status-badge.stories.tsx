import { PlanStatusBadge } from './plan-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof PlanStatusBadge> = {
  title: 'Features/Subscriptions/PlanStatusBadge',
  component: PlanStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Draft', 'PendingReview', 'Published', 'Archived'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = { args: { status: 'Draft' } };
export const PendingReview: Story = { args: { status: 'PendingReview' } };
export const Published: Story = { args: { status: 'Published' } };
export const Archived: Story = { args: { status: 'Archived' } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <PlanStatusBadge status="Draft" />
      <PlanStatusBadge status="PendingReview" />
      <PlanStatusBadge status="Published" />
      <PlanStatusBadge status="Archived" />
    </div>
  ),
};
