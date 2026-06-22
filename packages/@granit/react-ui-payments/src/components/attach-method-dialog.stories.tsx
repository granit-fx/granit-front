import { createApiClient } from '@granit/api-client';
import { PaymentsProvider } from '@granit/react-payments';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { AttachMethodDialog } from './attach-method-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof AttachMethodDialog> = {
  title: 'Payments/AttachMethodDialog',
  component: AttachMethodDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <PaymentsProvider config={{ client, basePath: '/api/v1/payments' }}>
          <Story />
        </PaymentsProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
