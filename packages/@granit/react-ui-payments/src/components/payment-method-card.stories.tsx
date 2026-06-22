import { toISODateString } from '@granit/types';
import { fn } from 'storybook/test';

import { PaymentMethodCard } from './payment-method-card';

import type { PaymentMethodResponse } from '@granit/payments';
import type { Meta, StoryObj } from '@storybook/react-vite';

const baseMethod: PaymentMethodResponse = {
  id: '11111111-1111-1111-1111-111111111111',
  type: 'Card',
  providerName: 'Stripe',
  providerMethodId: 'pm_1ABC',
  displayLabel: 'Visa •••• 4242',
  isDefault: true,
  expiresAt: toISODateString('2027-12-31T00:00:00Z'),
  tenantId: null,
};

const meta: Meta<typeof PaymentMethodCard> = {
  title: 'Payments/PaymentMethodCard',
  component: PaymentMethodCard,
  tags: ['autodocs'],
  args: {
    method: baseMethod,
    onDetach: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NonDefault: Story = {
  args: {
    method: { ...baseMethod, isDefault: false, expiresAt: null },
  },
};

export const BankRedirect: Story = {
  args: {
    method: {
      ...baseMethod,
      type: 'bancontact',
      providerName: 'mollie',
      displayLabel: 'Bancontact',
      isDefault: false,
    },
  },
};
