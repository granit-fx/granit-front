import { createApiClient } from '@granit/api-client';
import { TaxonomyProvider } from '@granit/react-taxonomy';
import { createTaxonomyHandlers } from '@granit/react-taxonomy/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CategoryTreePage } from './category-tree-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof CategoryTreePage> = {
  title: 'Features/Taxonomy/CategoryTreePage',
  component: CategoryTreePage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'padded',
    // Seeded from the shared @granit/react-taxonomy/testing store — full,
    // contract-valid DTOs (tenantId, iconName, …) instead of inline literals.
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
type Story = StoryObj<typeof CategoryTreePage>;

export const Default: Story = {};
