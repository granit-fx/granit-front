import { createApiClient } from '@granit/api-client';
import { TaxonomyProvider } from '@granit/react-taxonomy';
import { createTaxonomyHandlers } from '@granit/react-taxonomy/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TagManagerPage } from './tag-manager-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof TagManagerPage> = {
  title: 'Features/Taxonomy/TagManagerPage',
  component: TagManagerPage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'padded',
    // Seeded from the shared @granit/react-taxonomy/testing store — full,
    // contract-valid DTOs (tenantId, …) instead of inline literals.
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
type Story = StoryObj<typeof TagManagerPage>;

export const Default: Story = {};
