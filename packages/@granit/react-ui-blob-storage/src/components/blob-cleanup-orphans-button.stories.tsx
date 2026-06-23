import { createApiClient } from '@granit/api-client';
import { BlobStorageProvider } from '@granit/react-blob-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { BlobCleanupOrphansButton } from './blob-cleanup-orphans-button';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof BlobCleanupOrphansButton> = {
  title: 'Features/BlobStorage/BlobCleanupOrphansButton',
  component: BlobCleanupOrphansButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [http.post('*/cleanup-orphans', () => HttpResponse.json({ cleanedCount: 3 }))],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <BlobStorageProvider config={{ client }}>
          <Story />
        </BlobStorageProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The trigger button; clicking it opens a confirmation dialog. */
export const Default: Story = {};
