import { createApiClient } from '@granit/api-client';
import { SettingsProvider } from '@granit/react-settings';
import { createSettingsHandlers } from '@granit/react-settings/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppSettingsPanel } from './app-settings-panel';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof AppSettingsPanel> = {
  title: 'Settings/AppSettingsPanel',
  component: AppSettingsPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createSettingsHandlers(),
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <SettingsProvider config={{ client, basePath: '/api/v1' }}>
          <Story />
        </SettingsProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AppSettingsPanel>;

export const Default: Story = {};
