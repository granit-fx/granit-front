import { createApiClient } from '@granit/api-client';
import { ImportProvider } from '@granit/react-data-exchange';
import { createDataExchangeHandlers, mockImportHistory } from '@granit/react-data-exchange/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { ImportReportDialog } from './import-report-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof ImportReportDialog> = {
  title: 'DataExchange/ImportReportDialog',
  component: ImportReportDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createDataExchangeHandlers(),
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ImportProvider config={{ client, basePath: '/api/v1/data-exchange' }}>
          <Story />
        </ImportProvider>
      </QueryClientProvider>
    ),
  ],
  argTypes: {
    open: { control: 'boolean' },
    onOpenChange: { action: 'onOpenChange' },
  },
};

export default meta;
type Story = StoryObj<typeof ImportReportDialog>;

export const Default: Story = {
  args: {
    job: mockImportHistory[0],
    open: true,
    onOpenChange: fn(),
  },
};

export const Closed: Story = {
  args: {
    job: mockImportHistory[0],
    open: false,
    onOpenChange: fn(),
  },
};
