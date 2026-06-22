import { createApiClient } from '@granit/api-client';
import { PaymentsProvider } from '@granit/react-payments';
import { createPaymentsConfigurationHandlers } from '@granit/react-payments/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PaymentConfigurationSection } from './payment-configuration-section';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof PaymentConfigurationSection> = {
  title: 'Payments/PaymentConfigurationSection',
  component: PaymentConfigurationSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: { handlers: createPaymentsConfigurationHandlers('/api/v1/payments') },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <PaymentsProvider config={{ client, basePath: '/api/v1/payments' }}>
          <div className="w-full max-w-3xl">
            <Story />
          </div>
        </PaymentsProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
