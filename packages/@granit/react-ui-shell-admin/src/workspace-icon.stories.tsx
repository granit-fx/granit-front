import { WorkspaceIcon } from './workspace-icon';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Shell Admin/WorkspaceIcon',
  component: WorkspaceIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof WorkspaceIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { name: 'shield-user', className: 'size-5' },
};

export const UsersRound: Story = {
  args: { name: 'users-round', className: 'size-5' },
};

export const MonitorSmartphone: Story = {
  args: { name: 'monitor-smartphone', className: 'size-5' },
};

export const NullNameFallback: Story = {
  name: 'Null Name (Fallback Square)',
  args: { name: null, className: 'size-5' },
};

export const UnknownNameFallback: Story = {
  name: 'Unknown Name (Fallback Square)',
  args: { name: 'not-a-real-icon-name-xyz', className: 'size-5' },
};

export const LargeSize: Story = {
  args: { name: 'shield-user', className: 'size-10 text-primary' },
};
