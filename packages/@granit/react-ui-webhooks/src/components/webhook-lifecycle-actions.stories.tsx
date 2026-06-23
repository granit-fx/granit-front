import { WebhookLifecycleActions } from './webhook-lifecycle-actions';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof WebhookLifecycleActions> = {
  title: 'Features/Webhooks/WebhookLifecycleActions',
  component: WebhookLifecycleActions,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['Active', 'Suspended', 'Deactivated'],
    },
    onActivate: { action: 'onActivate' },
    onSuspend: { action: 'onSuspend' },
    onDeactivate: { action: 'onDeactivate' },
    onDelete: { action: 'onDelete' },
    isActivating: { control: 'boolean' },
    isSuspending: { control: 'boolean' },
    isDeactivating: { control: 'boolean' },
    isDeleting: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    status: 'Active',
    onActivate: () => {},
    onSuspend: () => {},
    onDeactivate: () => {},
    onDelete: () => {},
  },
};

export const Suspended: Story = {
  args: {
    status: 'Suspended',
    onActivate: () => {},
    onSuspend: () => {},
    onDeactivate: () => {},
    onDelete: () => {},
  },
};

export const Deactivated: Story = {
  args: {
    status: 'Deactivated',
    onActivate: () => {},
    onSuspend: () => {},
    onDeactivate: () => {},
    onDelete: () => {},
  },
};
