import { CmsHostnameStatusBadge } from './cms-hostname-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof CmsHostnameStatusBadge> = {
  title: 'CMS Hostnames/CmsHostnameStatusBadge',
  component: CmsHostnameStatusBadge,
  tags: ['autodocs'],
  args: { status: 'Active' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = { args: { status: 'Active' } };
export const Pending: Story = { args: { status: 'Pending' } };
export const Verifying: Story = { args: { status: 'Verifying' } };
export const Error: Story = { args: { status: 'Error' } };
export const Unknown: Story = { args: { status: 'Suspended' } };
