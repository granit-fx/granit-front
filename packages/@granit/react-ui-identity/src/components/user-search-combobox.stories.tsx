import { createApiClient } from '@granit/api-client';
import { IdentityProvider } from '@granit/react-identity';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { UserSearchCombobox } from './user-search-combobox';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof UserSearchCombobox> = {
  title: 'Identity/UserSearchCombobox',
  component: UserSearchCombobox,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <IdentityProvider config={{ client }}>
          <div className="w-96 rounded-md border">
            <Story />
          </div>
        </IdentityProvider>
      </QueryClientProvider>
    ),
  ],
  args: { onSelect: fn() },
};

export default meta;
type Story = StoryObj<typeof UserSearchCombobox>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
  args: { placeholder: 'Find a colleague...' },
};

export const ExcludingUsers: Story = {
  args: { excludeUserIds: ['u-001', 'u-002'] },
};
