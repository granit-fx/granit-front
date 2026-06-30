import { createApiClient } from '@granit/api-client';
import { TaxonomyProvider } from '@granit/react-taxonomy';
import { createTaxonomyHandlers } from '@granit/react-taxonomy/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TagManager } from './tag-manager';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof TagManager> = {
  title: 'Features/Taxonomy/TagManager',
  component: TagManager,
  tags: ['autodocs', '!test'],
  args: { scope: 'documents' },
  parameters: {
    layout: 'padded',
    // Stateful store from @granit/react-taxonomy/testing — create/edit/delete
    // round-trips against contract-valid tag fixtures.
    msw: { handlers: createTaxonomyHandlers() },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <TaxonomyProvider config={{ client }}>
          <Story />
        </TaxonomyProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TagManager>;

export const ReadOnly: Story = { args: { canManage: false } };

export const Manageable: Story = { args: { canManage: true } };
