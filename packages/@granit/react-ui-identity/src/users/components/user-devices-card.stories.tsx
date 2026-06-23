import { createApiClient } from '@granit/api-client';
import { IdentityProvider } from '@granit/react-identity';
import { toEntityId } from '@granit/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { UserDevicesCard } from './user-devices-card';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof UserDevicesCard> = {
  title: 'Identity/UserDevicesCard',
  component: UserDevicesCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <IdentityProvider config={{ client }}>
          <div className="w-[32rem]">
            <Story />
          </div>
        </IdentityProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UserDevicesCard>;

export const Default: Story = {
  args: { userId: toEntityId('u-001') },
};
