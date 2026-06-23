import { fn } from 'storybook/test';

import { TenantStatusDialog } from './tenant-status-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof TenantStatusDialog> = {
  title: 'Features/Tenants/TenantStatusDialog',
  component: TenantStatusDialog,
  tags: ['autodocs'],
  args: {
    tenantName: 'Acme Corp',
    open: true,
    onOpenChange: fn(),
    onConfirm: fn(),
    isPending: false,
  },
  argTypes: {
    action: { control: 'inline-radio', options: ['activate', 'deactivate'] },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Deactivate: Story = {
  args: { action: 'deactivate' },
};

export const Activate: Story = {
  args: { action: 'activate' },
};

export const Pending: Story = {
  args: { action: 'deactivate', isPending: true },
};
