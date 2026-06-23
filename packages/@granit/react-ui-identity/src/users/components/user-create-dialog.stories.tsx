import { createApiClient } from '@granit/api-client';
import { IdentityProvider } from '@granit/react-identity';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { UserCreateDialog } from './user-create-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof UserCreateDialog> = {
  title: 'Identity/UserCreateDialog',
  component: UserCreateDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <IdentityProvider config={{ client }}>
          <Story />
        </IdentityProvider>
      </QueryClientProvider>
    ),
  ],
  args: { onOpenChange: fn() },
};

export default meta;
type Story = StoryObj<typeof UserCreateDialog>;

export const Open: Story = {
  args: { open: true },
};

export const Closed: Story = {
  args: { open: false },
};
