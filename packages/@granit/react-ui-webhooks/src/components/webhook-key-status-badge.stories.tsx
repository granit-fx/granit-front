import { WebhookSigningKeyStatus } from '@granit/webhooks';

import { WebhookKeyStatusBadge } from './webhook-key-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof WebhookKeyStatusBadge> = {
  title: 'Features/Webhooks/WebhookKeyStatusBadge',
  component: WebhookKeyStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: [
        WebhookSigningKeyStatus.Active,
        WebhookSigningKeyStatus.Retired,
        WebhookSigningKeyStatus.Revoked,
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = { args: { status: WebhookSigningKeyStatus.Active } };
export const Retired: Story = { args: { status: WebhookSigningKeyStatus.Retired } };
export const Revoked: Story = { args: { status: WebhookSigningKeyStatus.Revoked } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <WebhookKeyStatusBadge status={WebhookSigningKeyStatus.Active} />
      <WebhookKeyStatusBadge status={WebhookSigningKeyStatus.Retired} />
      <WebhookKeyStatusBadge status={WebhookSigningKeyStatus.Revoked} />
    </div>
  ),
};
