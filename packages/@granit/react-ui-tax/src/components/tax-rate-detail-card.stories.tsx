import { createApiClient } from '@granit/api-client';
import { TaxProvider } from '@granit/react-tax';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TaxRateDetailCard } from './tax-rate-detail-card';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof TaxRateDetailCard> = {
  title: 'Tax/TaxRateDetailCard',
  component: TaxRateDetailCard,
  tags: ['autodocs'],
  args: {
    countryCode: 'BE',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <TaxProvider config={{ client, basePath: '/api/v1/tax' }}>
          <Story />
        </TaxProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Belgium: Story = {};

export const France: Story = {
  args: { countryCode: 'FR' },
};

export const NotFound: Story = {
  args: { countryCode: 'ZZ' },
};
