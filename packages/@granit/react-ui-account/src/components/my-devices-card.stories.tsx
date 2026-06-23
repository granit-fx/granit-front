import { createApiClient } from '@granit/api-client';
import { IdentityProvider } from '@granit/react-identity';
import { createIdentityHandlers } from '@granit/react-identity/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { MyDevicesCard } from './my-devices-card';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof MyDevicesCard> = {
  title: 'Account/MyDevicesCard',
  component: MyDevicesCard,
  tags: ['autodocs'],
  args: { sessionTrackingEnabled: true },
  parameters: {
    layout: 'padded',
    msw: { handlers: createIdentityHandlers() },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <IdentityProvider config={{ client }}>
          <div className="w-96">
            <Story />
          </div>
        </IdentityProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The caller's own devices, served by the self-service `/devices` endpoint. */
export const Default: Story = {};
