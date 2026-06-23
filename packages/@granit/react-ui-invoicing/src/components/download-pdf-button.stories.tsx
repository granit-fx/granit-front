import { createApiClient } from '@granit/api-client';
import { InvoicingProvider } from '@granit/react-invoicing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DownloadPdfButton } from './download-pdf-button';

import type { InvoiceId } from '@granit/invoicing';
import type { InvoicingConfig } from '@granit/react-invoicing';
import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const invoicingConfig: InvoicingConfig = {
  client: createApiClient({ baseURL: '' }),
  basePath: '/api/v1/invoicing',
};

const meta: Meta<typeof DownloadPdfButton> = {
  title: 'Features/Invoicing/DownloadPdfButton',
  component: DownloadPdfButton,
  tags: ['autodocs'],
  args: {
    invoiceId: 'inv-1' as InvoiceId,
    invoiceNumber: 'INV-2026-0001',
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
