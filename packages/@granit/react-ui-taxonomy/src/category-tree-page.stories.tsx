import { createApiClient } from '@granit/api-client';
import { TaxonomyProvider } from '@granit/react-taxonomy';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { CategoryTreePage } from './category-tree-page';

import type { CategoryResponse } from '@granit/taxonomy';
import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const sampleRoots: readonly CategoryResponse[] = [
  {
    id: 'cat-legal',
    scope: 'documents',
    parentId: null,
    path: '/legal',
    name: 'Legal',
    depth: 0,
    hasChildren: true,
    createdAt: new Date().toISOString(),
    modifiedAt: null,
    concurrencyStamp: 'stamp-1',
  },
  {
    id: 'cat-finance',
    scope: 'documents',
    parentId: null,
    path: '/finance',
    name: 'Finance',
    depth: 0,
    hasChildren: false,
    createdAt: new Date().toISOString(),
    modifiedAt: null,
    concurrencyStamp: 'stamp-1',
  },
];

const meta: Meta<typeof CategoryTreePage> = {
  title: 'Features/Taxonomy/CategoryTreePage',
  component: CategoryTreePage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [http.get('/api/v1/taxonomy/categories', () => HttpResponse.json(sampleRoots))],
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
type Story = StoryObj<typeof CategoryTreePage>;

export const Default: Story = {};
