import { createApiClient } from '@granit/api-client';
import { MeteringProvider } from '@granit/react-metering';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { RecordEventsDialog } from './record-events-dialog';

import type { MeterDefinitionResponse } from '@granit/metering';
import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meter: MeterDefinitionResponse = {
  id: '44444444-4444-4444-4444-444444444444',
  name: 'API Calls',
  unit: 'calls',
  description: 'Counts inbound API requests per tenant.',
  aggregationType: 'Count',
  productId: null,
  lifecycleStatus: 'Published',
  distinctProperty: null,
};

const meta: Meta<typeof RecordEventsDialog> = {
  title: 'Metering/RecordEventsDialog',
  component: RecordEventsDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    meter,
    onOpenChange: fn(),
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MeteringProvider config={{ client, basePath: '/api/v1/metering' }}>
          <Story />
        </MeteringProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
