import { createApiClient } from '@granit/api-client';
import { IotProvider } from '@granit/react-iot';
import { createIotHandlers, sampleDevices } from '@granit/react-iot/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';

import { storyI18n } from '../stories-i18n';

import { DeviceTelemetryCard } from './device-telemetry-card';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof DeviceTelemetryCard> = {
  title: 'IoT/DeviceTelemetryCard',
  component: DeviceTelemetryCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded', msw: { handlers: createIotHandlers() } },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <IotProvider config={{ client }}>
            <div className="max-w-xl">
              <Story />
            </div>
          </IotProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Latest reading plus the on-demand metric aggregate, backed by the mock handlers. */
export const Default: Story = {
  args: { deviceId: sampleDevices[0]!.id },
};
