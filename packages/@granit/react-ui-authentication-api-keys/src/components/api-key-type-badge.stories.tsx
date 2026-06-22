import { I18nextProvider } from 'react-i18next';

import { storyI18n } from '../stories-i18n';

import { ApiKeyTypeBadge } from './api-key-type-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ApiKeyTypeBadge> = {
  title: 'API Keys/ApiKeyTypeBadge',
  component: ApiKeyTypeBadge,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
  argTypes: {
    type: {
      control: 'select',
      options: ['Secret', 'Publishable', 'Webhook', 'Ephemeral'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Secret: Story = { args: { type: 'Secret' } };
export const Publishable: Story = { args: { type: 'Publishable' } };
export const Webhook: Story = { args: { type: 'Webhook' } };
export const Ephemeral: Story = { args: { type: 'Ephemeral' } };

export const AllTypes: Story = {
  render: () => (
    <div className="flex gap-2">
      <ApiKeyTypeBadge type="Secret" />
      <ApiKeyTypeBadge type="Publishable" />
      <ApiKeyTypeBadge type="Webhook" />
      <ApiKeyTypeBadge type="Ephemeral" />
    </div>
  ),
};
