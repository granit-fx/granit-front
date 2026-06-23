import { createApiClient } from '@granit/api-client';
import { DataExchangeProvider } from '@granit/react-data-exchange';
import { createDataExchangeHandlers } from '@granit/react-data-exchange/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { ImportDialog } from './import-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof ImportDialog> = {
  title: 'DataExchange/ImportDialog',
  component: ImportDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: createDataExchangeHandlers(),
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <DataExchangeProvider config={{ client, basePath: '/api/v1/data-exchange' }}>
          <Story />
        </DataExchangeProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    open: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ImportDialog>;

export const Default: Story = {
  args: {
    definitionName: 'Admin.CountryImport',
  },
};

export const CsvOnly: Story = {
  args: {
    definitionName: 'Admin.CountryImport',
    accept: ['.csv'],
  },
};
