import { I18nextProvider } from 'react-i18next';

import { storyI18n } from '../stories-i18n';

import { ApiKeyStatusBadge } from './api-key-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ApiKeyStatusBadge> = {
  title: 'API Keys/ApiKeyStatusBadge',
  component: ApiKeyStatusBadge,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'revoked', 'expired'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = { args: { status: 'active' } };
export const Revoked: Story = { args: { status: 'revoked' } };
export const Expired: Story = { args: { status: 'expired' } };

export const AllStatuses: Story = {
  render: () => (
    <div className="flex gap-2">
      <ApiKeyStatusBadge status="active" />
      <ApiKeyStatusBadge status="revoked" />
      <ApiKeyStatusBadge status="expired" />
    </div>
  ),
};
