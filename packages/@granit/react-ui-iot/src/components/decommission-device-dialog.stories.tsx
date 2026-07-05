import { createApiClient } from '@granit/api-client';
import { IotProvider } from '@granit/react-iot';
import { createIotHandlers, sampleDevices } from '@granit/react-iot/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { fn } from 'storybook/test';

import { storyI18n } from '../stories-i18n';

import { DecommissionDeviceDialog } from './decommission-device-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof DecommissionDeviceDialog> = {
  title: 'IoT/DecommissionDeviceDialog',
  component: DecommissionDeviceDialog,
  tags: ['autodocs'],
  parameters: { msw: { handlers: createIotHandlers() } },
  args: {
    open: true,
    device: sampleDevices[0]!,
    onOpenChange: fn(),
    onSuccess: fn(),
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <IotProvider config={{ client }}>
            <Story />
          </IotProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
