import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { BlobStorageProvider } from '@granit/react-blob-storage';
import { blobQueryMetadata, createBlobStorageHandlers } from '@granit/react-blob-storage/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { BlobListPage } from './blob-list-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const BASE = '/api/v1/blob-storage';

/** Grants the full admin permission set so the row actions + cleanup button render. */
const grantManage = http.get('/api/v1/authorization/permissions', () =>
  HttpResponse.json({
    permissions: ['BlobStorage.Administration.Read', 'BlobStorage.Administration.Manage'],
  })
);

/** Read-only: only the Read permission, so the manage actions stay hidden. */
const grantReadOnly = http.get('/api/v1/authorization/permissions', () =>
  HttpResponse.json({ permissions: ['BlobStorage.Administration.Read'] })
);

const metaHandler = http.get(`${BASE}/blobs/meta`, () => HttpResponse.json(blobQueryMetadata));

const meta: Meta<typeof BlobListPage> = {
  title: 'Features/BlobStorage/BlobListPage',
  component: BlobListPage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: [grantManage, metaHandler, ...createBlobStorageHandlers()] },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={client}>
          <BlobStorageProvider config={{ client }}>
            <div className="p-6">
              <Story />
            </div>
          </BlobStorageProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Full admin view: the query grid backed by the mock blobs, with per-row download/delete and orphan-cleanup. */
export const Default: Story = {};

/** Read-only view (no `Manage` permission): the actions column and cleanup button are hidden. */
export const ReadOnly: Story = {
  parameters: {
    msw: { handlers: [grantReadOnly, metaHandler, ...createBlobStorageHandlers()] },
  },
};
