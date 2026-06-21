import { PermissionSideBadge } from './permission-side-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof PermissionSideBadge> = {
  title: 'Authorization/PermissionSideBadge',
  component: PermissionSideBadge,
  tags: ['autodocs'],
  argTypes: {
    side: {
      control: 'select',
      options: ['Host', 'Tenant', 'Both'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Host: Story = { args: { side: 'Host' } };
export const Tenant: Story = { args: { side: 'Tenant' } };
export const Both: Story = { args: { side: 'Both' } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <PermissionSideBadge side="Host" />
      <PermissionSideBadge side="Tenant" />
      <PermissionSideBadge side="Both" />
    </div>
  ),
};
