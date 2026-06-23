import { createApiClient } from '@granit/api-client';
import { PartiesProvider } from '@granit/react-parties';
import { sampleParty } from '@granit/react-parties/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LifecycleActions } from './lifecycle-actions';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof LifecycleActions> = {
  title: 'Features/Parties/LifecycleActions',
  component: LifecycleActions,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <PartiesProvider config={{ client, basePath: '/api/v1/parties' }}>
          <Story />
        </PartiesProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: { partyId: sampleParty.id, status: 'Active' },
};

export const Suspended: Story = {
  args: { partyId: sampleParty.id, status: 'Suspended' },
};

export const Archived: Story = {
  args: { partyId: sampleParty.id, status: 'Archived' },
};
