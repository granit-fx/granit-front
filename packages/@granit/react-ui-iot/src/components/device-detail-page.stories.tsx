import { createApiClient } from '@granit/api-client';
import { IotProvider } from '@granit/react-iot';
import { createIotHandlers, sampleDevices } from '@granit/react-iot/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';

import { storyI18n } from '../stories-i18n';

import { DeviceDetailPage } from './device-detail-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const deviceId = sampleDevices[0]!.id;

const meta: Meta<typeof DeviceDetailPage> = {
  title: 'IoT/DeviceDetailPage',
  component: DeviceDetailPage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createIotHandlers() },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <IotProvider config={{ client }}>
            <MemoryRouter initialEntries={[`/iot/devices/${deviceId}`]}>
              <Routes>
                <Route
                  path="/iot/devices/:id"
                  element={
                    <div className="p-6">
                      <Story />
                    </div>
                  }
                />
              </Routes>
            </MemoryRouter>
          </IotProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Device detail: info card + telemetry panel, with edit / decommission actions. */
export const Default: Story = {};
