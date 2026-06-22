import { I18nextProvider } from 'react-i18next';

import { storyI18n } from '../stories-i18n';

import { ApiKeyEnvironmentBadge } from './api-key-environment-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ApiKeyEnvironmentBadge> = {
  title: 'API Keys/ApiKeyEnvironmentBadge',
  component: ApiKeyEnvironmentBadge,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
  argTypes: {
    environment: {
      control: 'select',
      options: ['live', 'test', 'dev'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = { args: { environment: 'live' } };
export const Test: Story = { args: { environment: 'test' } };
export const Dev: Story = { args: { environment: 'dev' } };

export const AllEnvironments: Story = {
  render: () => (
    <div className="flex gap-2">
      <ApiKeyEnvironmentBadge environment="live" />
      <ApiKeyEnvironmentBadge environment="test" />
      <ApiKeyEnvironmentBadge environment="dev" />
    </div>
  ),
};
