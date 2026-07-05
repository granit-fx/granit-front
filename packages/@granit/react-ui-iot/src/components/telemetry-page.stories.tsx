import { createApiClient } from '@granit/api-client';
import { IotProvider } from '@granit/react-iot';
import { createIotHandlers } from '@granit/react-iot/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';

import { storyI18n } from '../stories-i18n';

import { TelemetryPage } from './telemetry-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof TelemetryPage> = {
  title: 'IoT/TelemetryPage',
  component: TelemetryPage,
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
            <div className="p-6">
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

/** The telemetry explorer grid, scoped by IotTelemetryProvider under IotProvider. */
export const Default: Story = {};
