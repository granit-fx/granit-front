import { fn } from 'storybook/test';

import { LifecycleConfirmDialog } from './dashboard-lifecycle-dialog';

import type { PendingLifecycle } from './dashboard-lifecycle-types';
import type { DashboardSummaryResponse } from '@granit/dashboards';
import type { Meta, StoryObj } from '@storybook/react-vite';

const sampleDashboard: DashboardSummaryResponse = {
  id: 'dash-001',
  name: 'Finance Overview',
  category: 'Finance',
  status: 'Draft',
  isSystem: true,
  sourceDefinitionName: 'Granit.Invoicing.FinanceOverview',
  sourceDefinitionVersion: '1.2.0',
  widgetCount: 6,
};

const pending = (action: PendingLifecycle['action']): PendingLifecycle => ({
  action,
  dashboard: sampleDashboard,
});

const meta: Meta<typeof LifecycleConfirmDialog> = {
  title: 'Dashboards/LifecycleConfirmDialog',
  component: LifecycleConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onCancel: { action: 'onCancel' },
    onConfirm: { action: 'onConfirm' },
  },
};

export default meta;
type Story = StoryObj<typeof LifecycleConfirmDialog>;

export const Publish: Story = {
  args: {
    pending: pending('publish'),
    isPending: false,
    onCancel: fn(),
    onConfirm: fn(),
  },
};

export const Archive: Story = {
  args: {
    pending: pending('archive'),
    isPending: false,
    onCancel: fn(),
    onConfirm: fn(),
  },
};

export const Resync: Story = {
  args: {
    pending: pending('resync'),
    isPending: false,
    onCancel: fn(),
    onConfirm: fn(),
  },
};

export const Pending: Story = {
  args: {
    pending: pending('publish'),
    isPending: true,
    onCancel: fn(),
    onConfirm: fn(),
  },
};
