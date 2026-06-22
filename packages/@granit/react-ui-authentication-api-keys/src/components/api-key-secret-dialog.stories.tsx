import { I18nextProvider } from 'react-i18next';
import { fn } from 'storybook/test';

import { storyI18n } from '../stories-i18n';

import { ApiKeySecretDialog } from './api-key-secret-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ApiKeySecretDialog> = {
  title: 'API Keys/ApiKeySecretDialog',
  component: ApiKeySecretDialog,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
  argTypes: {
    open: { control: 'boolean' },
    secret: { control: 'text' },
  },
  args: {
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    secret: 'gk_test_EXAMPLE_000000000000000000000000000000', // gitleaks:allow
  },
};
