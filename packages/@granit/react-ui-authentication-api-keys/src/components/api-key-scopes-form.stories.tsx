import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { fn } from 'storybook/test';

import { storyI18n } from '../stories-i18n';

import { ApiKeyScopesForm } from './api-key-scopes-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ApiKeyScopesForm> = {
  title: 'API Keys/ApiKeyScopesForm',
  component: ApiKeyScopesForm,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </I18nextProvider>
    ),
  ],
  parameters: { layout: 'padded' },
  argTypes: {
    isPending: { control: 'boolean' },
  },
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    defaultValues: { permissions: [], allowedCidrs: [] },
    isPending: false,
  },
};

export const WithValues: Story = {
  args: {
    defaultValues: {
      permissions: ['read:patients', 'write:patients', 'read:appointments'],
      allowedCidrs: ['10.0.0.0/8', '192.168.1.0/24'],
    },
    isPending: false,
  },
};

export const Pending: Story = {
  args: {
    defaultValues: {
      permissions: ['read:patients'],
      allowedCidrs: ['10.0.0.0/8'],
    },
    isPending: true,
  },
};

export const PermissionsOnly: Story = {
  args: {
    defaultValues: {
      permissions: ['read:patients', 'write:patients'],
      allowedCidrs: ['10.0.0.0/8'],
    },
    fields: ['permissions'],
  },
};

export const CidrsOnly: Story = {
  args: {
    defaultValues: {
      permissions: ['read:patients'],
      allowedCidrs: ['10.0.0.0/8', '192.168.1.0/24'],
    },
    fields: ['allowedCidrs'],
  },
};
