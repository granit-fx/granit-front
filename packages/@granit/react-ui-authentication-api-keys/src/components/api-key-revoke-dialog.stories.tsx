import { I18nextProvider } from 'react-i18next';
import { fn } from 'storybook/test';

import { storyI18n } from '../stories-i18n';

import { ApiKeyRevokeDialog } from './api-key-revoke-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ApiKeyRevokeDialog> = {
  title: 'API Keys/ApiKeyRevokeDialog',
  component: ApiKeyRevokeDialog,
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
    keyName: { control: 'text' },
    isPending: { control: 'boolean' },
  },
  args: {
    onOpenChange: fn(),
    onConfirm: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    keyName: 'Patient Sync Service',
    isPending: false,
  },
};

export const Pending: Story = {
  args: {
    open: true,
    keyName: 'Patient Sync Service',
    isPending: true,
  },
};
