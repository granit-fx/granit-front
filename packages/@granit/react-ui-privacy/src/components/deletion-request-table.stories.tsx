import { createApiClient } from '@granit/api-client';
import { PrivacyProvider } from '@granit/react-privacy';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { DeletionRequestTable } from './deletion-request-table';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof DeletionRequestTable> = {
  title: 'Features/Privacy/DeletionRequestTable',
  component: DeletionRequestTable,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <PrivacyProvider config={{ client, basePath: '/api/v1/privacy' }}>
          <Story />
        </PrivacyProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const DEFERRED_REQUEST = {
  requestId: '11111111-1111-4111-8111-111111111111',
  reason: 'User-initiated account closure',
  state: 'Deferred',
  requestedAt: '2026-06-01T09:00:00Z',
  scheduledDeletionAt: '2026-07-01T09:00:00Z',
  cancelledAt: null,
};

const CANCELLED_REQUEST = {
  requestId: '22222222-2222-4222-8222-222222222222',
  reason: 'Superseded by data export',
  state: 'Cancelled',
  requestedAt: '2026-05-10T09:00:00Z',
  scheduledDeletionAt: '2026-06-10T09:00:00Z',
  cancelledAt: '2026-05-12T14:00:00Z',
};

export const WithRequests: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/deletions', () => HttpResponse.json([DEFERRED_REQUEST, CANCELLED_REQUEST])),
      ],
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [http.get('*/deletions', () => HttpResponse.json([]))],
    },
  },
};
