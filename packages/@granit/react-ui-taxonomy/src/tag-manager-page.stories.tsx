import { createApiClient } from '@granit/api-client';
import { TaxonomyProvider } from '@granit/react-taxonomy';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { TagManagerPage } from './tag-manager-page';

import type { TagResponse } from '@granit/taxonomy';
import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const sampleTags: readonly TagResponse[] = [
  {
    id: 'tag-001',
    scope: 'documents',
    name: 'Contract',
    color: '#3B82F6',
    hideOnEntityCard: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    concurrencyStamp: 'stamp-1',
  },
  {
    id: 'tag-002',
    scope: 'documents',
    name: 'Invoice',
    color: '#10B981',
    hideOnEntityCard: false,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    concurrencyStamp: 'stamp-1',
  },
  {
    id: 'tag-003',
    scope: 'documents',
    name: 'Internal',
    color: '#A855F7',
    hideOnEntityCard: true,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    concurrencyStamp: 'stamp-1',
  },
];

const meta: Meta<typeof TagManagerPage> = {
  title: 'Features/Taxonomy/TagManagerPage',
  component: TagManagerPage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [http.get('/api/v1/taxonomy/tags', () => HttpResponse.json(sampleTags))],
    },
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
