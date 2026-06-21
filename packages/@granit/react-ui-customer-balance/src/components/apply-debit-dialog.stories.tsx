import { createApiClient } from '@granit/api-client';
import { CustomerBalanceProvider } from '@granit/react-customer-balance';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { ApplyDebitDialog } from './apply-debit-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof ApplyDebitDialog> = {
  title: 'CustomerBalance/ApplyDebitDialog',
  component: ApplyDebitDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <CustomerBalanceProvider config={{ client, basePath: '/api/v1/customer-balance' }}>
          <Story />
        </CustomerBalanceProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
