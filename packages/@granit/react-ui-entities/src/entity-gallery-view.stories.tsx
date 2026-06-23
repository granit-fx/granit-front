import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { QueryEndpointStateProvider, QueryProvider } from '@granit/react-query-engine';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { fn } from 'storybook/test';

import { EntityGalleryView } from './entity-gallery-view';

import type { ExtendedEntityManifest } from './manifest-extensions';
import type { EntityGalleryLayoutManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const BASE_PATH = '/api/v1/entities/Granit.Catalog.Product';

const mockApiClient = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

const layout: EntityGalleryLayoutManifest = {
  imagePropertyName: 'Image',
  titlePropertyName: 'Name',
  subtitlePropertyName: 'Category',
  groupByPropertyName: null,
  cardSize: 'Medium',
  actions: [],
};

const groupedLayout: EntityGalleryLayoutManifest = {
  ...layout,
  groupByPropertyName: 'Category',
};

const manifest = {
  schemaVersion: 1,
  identity: {
    name: 'Granit.Catalog.Product',
    entityClrType: 'Granit.Catalog.Product',
    displayKey: null,
    icon: null,
    permissionGroup: 'Catalog.Products',
    displayProperty: 'Name',
    subtitleProperty: null,
  },
  permissions: null,
  forms: null,
  details: null,
  collections: null,
  relations: null,
  actions: [],
  activities: null,
} as unknown as ExtendedEntityManifest;

const items = [
  { id: '1', name: 'Mechanical Keyboard', category: 'Peripherals', image: 'blob-1' },
  { id: '2', name: 'Wireless Mouse', category: 'Peripherals', image: 'blob-2' },
  { id: '3', name: '27-inch Monitor', category: 'Displays', image: 'blob-3' },
  { id: '4', name: 'Ultrawide Monitor', category: 'Displays', image: 'blob-4' },
];

// Single-page list response — `hasMore: false` ends the infinite query.
const listResponse = { items, totalCount: items.length, page: 1, pageSize: 50, hasMore: false };

const listHandlers = [
  http.get(BASE_PATH, () => HttpResponse.json(listResponse)),
  // Blob image downloads fall through harmlessly (the <img> onError swaps to
  // the placeholder), but answer them so no request 404s into index.html.
  http.get('/api/v1/blobs/:id/download', () => new HttpResponse(null, { status: 404 })),
];

const meta = {
  title: 'Layout/EntityGalleryView',
  component: EntityGalleryView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Host wrapper around the framework `<EntityGallery>`. Flat mode delegates the infinite-query + card markup to the framework and resolves each image via `<BlobImage>`. Grouped mode (ambient `groupBy`) walks the sorted rows and emits a section header whenever the group value changes.',
      },
    },
    msw: { handlers: listHandlers },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={makeQueryClient()}>
        <GranitClientProvider client={mockApiClient}>
          <QueryProvider config={{ basePath: BASE_PATH }}>
            <div className="bg-background p-6">
              <Story />
            </div>
          </QueryProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    manifest,
    layout,
    onCardClick: fn(),
    // Storybook stub for the host-injected image slot (the host wires
    // `<BlobImage>` from @granit/react-blob-storage).
    renderImage: () => (
      <div
        data-granit-gallery-card-image=""
        style={{ aspectRatio: '1', background: 'var(--muted, #e5e7eb)' }}
      />
    ),
  },
} satisfies Meta<typeof EntityGalleryView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Flat grid — framework-owned cards, no grouping. */
export const Flat: Story = {
  decorators: [
    (Story) => (
      <QueryEndpointStateProvider initialParams={{ page: 1, pageSize: 50, sort: [] }}>
        <Story />
      </QueryEndpointStateProvider>
    ),
  ],
};

/** Grouped grid — ambient `groupBy: Category` splits cards into sections. */
export const Grouped: Story = {
  args: { layout: groupedLayout },
  decorators: [
    (Story) => (
      <QueryEndpointStateProvider
        initialParams={{ page: 1, pageSize: 50, sort: [], groupBy: 'Category' }}
      >
        <Story />
      </QueryEndpointStateProvider>
    ),
  ],
};
