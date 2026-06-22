import { mockApiKeys } from '@granit/react-authentication-api-keys/testing';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';

import { storyI18n } from '../stories-i18n';

import { ApiKeyTable } from './api-key-table';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ApiKeyTable> = {
  title: 'API Keys/ApiKeyTable',
  component: ApiKeyTable,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <MemoryRouter>
          <div className="p-6">
            <Story />
          </div>
        </MemoryRouter>
      </I18nextProvider>
    ),
  ],
  args: {
    items: mockApiKeys,
    onRevoke: fn(),
    onRotate: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A mix of live/test keys across types and statuses. */
export const Default: Story = {};

/** Empty state — only the header row renders. */
export const Empty: Story = {
  args: { items: [] },
};
