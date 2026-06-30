import { createApiClient } from '@granit/api-client';
import { TaxonomyProvider } from '@granit/react-taxonomy';
import { createTaxonomyHandlers } from '@granit/react-taxonomy/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CategoryTree } from './category-tree';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof CategoryTree> = {
  title: 'Features/Taxonomy/CategoryTree',
  component: CategoryTree,
  tags: ['autodocs', '!test'],
  args: { scope: 'documents' },
  parameters: {
    layout: 'padded',
    // Stateful store from @granit/react-taxonomy/testing — CRUD via the
    // spec-driven dialogs round-trips against contract-valid fixtures.
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
type Story = StoryObj<typeof CategoryTree>;

export const ReadOnly: Story = { args: { canManage: false } };

export const Manageable: Story = { args: { canManage: true } };
