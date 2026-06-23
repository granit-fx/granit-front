import { PartyStatusBadge } from './party-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof PartyStatusBadge> = {
  title: 'Features/Parties/PartyStatusBadge',
  component: PartyStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Active', 'Suspended', 'Archived'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = { args: { status: 'Active' } };
export const Suspended: Story = { args: { status: 'Suspended' } };
export const Archived: Story = { args: { status: 'Archived' } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <PartyStatusBadge status="Active" />
      <PartyStatusBadge status="Suspended" />
      <PartyStatusBadge status="Archived" />
    </div>
  ),
};
