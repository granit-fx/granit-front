import { createApiClient } from '@granit/api-client';
import { TaxonomyProvider } from '@granit/react-taxonomy';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';

import { TaxonomyHeaderSearch } from './taxonomy-header-search';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof TaxonomyHeaderSearch> = {
  title: 'Features/Taxonomy/TaxonomyHeaderSearch',
  component: TaxonomyHeaderSearch,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [http.get('/api/v1/taxonomy/search', () => HttpResponse.json([]))],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <TaxonomyProvider config={{ client }}>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </TaxonomyProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TaxonomyHeaderSearch>;

export const Default: Story = {};
