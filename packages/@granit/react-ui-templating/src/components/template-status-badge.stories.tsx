import { TemplateStatusBadge } from './template-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof TemplateStatusBadge> = {
  title: 'Features/Templates/TemplateStatusBadge',
  component: TemplateStatusBadge,
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

export const AllStatuses: Story = {
  render: () => (
    <div className="flex gap-2">
      <TemplateStatusBadge status="Draft" />
      <TemplateStatusBadge status="PendingReview" />
      <TemplateStatusBadge status="Published" />
      <TemplateStatusBadge status="Archived" />
    </div>
  ),
};
