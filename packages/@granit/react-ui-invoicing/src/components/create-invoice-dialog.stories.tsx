import { createApiClient } from '@granit/api-client';
import { InvoicingProvider } from '@granit/react-invoicing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { CreateInvoiceDialog } from './create-invoice-dialog';

import type { InvoicingConfig } from '@granit/react-invoicing';
import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const invoicingConfig: InvoicingConfig = {
  client: createApiClient({ baseURL: '' }),
  basePath: '/api/v1/invoicing',
};

const meta: Meta<typeof CreateInvoiceDialog> = {
  title: 'Features/Invoicing/CreateInvoiceDialog',
  component: CreateInvoiceDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <InvoicingProvider config={invoicingConfig}>
          <Story />
        </InvoicingProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
