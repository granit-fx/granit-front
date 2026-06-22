import { createApiClient } from '@granit/api-client';
import { PaymentsProvider } from '@granit/react-payments';
import { toISODateString } from '@granit/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { DetachMethodDialog } from './detach-method-dialog';

import type { PaymentMethodResponse } from '@granit/payments';
import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const method: PaymentMethodResponse = {
  id: '11111111-1111-1111-1111-111111111111',
  type: 'Card',
  providerName: 'Stripe',
  providerMethodId: 'pm_1ABC',
  displayLabel: 'Visa •••• 4242',
  isDefault: false,
  expiresAt: toISODateString('2027-12-31T00:00:00Z'),
  tenantId: null,
};

const meta: Meta<typeof DetachMethodDialog> = {
  title: 'Payments/DetachMethodDialog',
  component: DetachMethodDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    method,
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
