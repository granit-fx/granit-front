import { PartyRolesBadges } from './party-roles-badges';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof PartyRolesBadges> = {
  title: 'Features/Parties/PartyRolesBadges',
  component: PartyRolesBadges,
  tags: ['autodocs'],
  argTypes: {
    roles: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleRole: Story = { args: { roles: 'Customer' } };
export const MultipleRoles: Story = { args: { roles: 'Customer,Supplier,Employee' } };
export const AllRoles: Story = { args: { roles: 'Customer,Supplier,Employee,Lead' } };
export const Empty: Story = { args: { roles: '' } };
export const Nullish: Story = { args: { roles: null } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <PartyRolesBadges roles="Customer" />
      <PartyRolesBadges roles="Customer,Supplier,Employee" />
      <PartyRolesBadges roles="Customer,Supplier,Employee,Lead" />
      <PartyRolesBadges roles="" />
      <PartyRolesBadges roles={null} />
    </div>
  ),
};
