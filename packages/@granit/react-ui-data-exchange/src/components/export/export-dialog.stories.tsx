import { createApiClient } from '@granit/api-client';
import { DataExchangeProvider } from '@granit/react-data-exchange';
import { createDataExchangeHandlers } from '@granit/react-data-exchange/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { ExportDialog } from './export-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof ExportDialog> = {
  title: 'DataExchange/ExportDialog',
  component: ExportDialog,
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
type Story = StoryObj<typeof ExportDialog>;

export const Default: Story = {
  args: {
    definitionName: 'Admin.CountryExport',
  },
};

export const UserExport: Story = {
  args: {
    definitionName: 'Admin.UserExport',
  },
};

export const FormatOverride: Story = {
  args: {
    definitionName: 'Admin.CountryExport',
    formats: ['csv'],
  },
};
