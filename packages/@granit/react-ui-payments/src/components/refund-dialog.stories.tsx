import { createApiClient } from '@granit/api-client';
import { PaymentsProvider } from '@granit/react-payments';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { RefundDialog } from './refund-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof RefundDialog> = {
  title: 'Payments/RefundDialog',
  component: RefundDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    transactionId: '22222222-2222-2222-2222-222222222222',
    maxAmount: 4999,
    currency: 'EUR',
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
