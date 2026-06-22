import { CapabilityBadges, PendingSnapshotBadge } from './capability-badges';

import type { PaymentMethodCapabilityResponse } from '@granit/payments';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof CapabilityBadges> = {
  title: 'Payments/CapabilityBadges',
  component: CapabilityBadges,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

const restricted: PaymentMethodCapabilityResponse = {
  supportedCountries: ['BE', 'FR', 'DE'],
  supportedCurrencies: ['EUR', 'GBP'],
  supportedSequenceTypes: ['oneoff', 'recurring'],
  amountBounds: [{ currencyCode: 'EUR', minAmount: 100, maxAmount: 500000 }],
};

const wildcard: PaymentMethodCapabilityResponse = {
  supportedCountries: [],
  supportedCurrencies: [],
  supportedSequenceTypes: [],
  amountBounds: [],
};

const overflow: PaymentMethodCapabilityResponse = {
  supportedCountries: ['BE', 'FR', 'DE', 'NL', 'LU'],
  supportedCurrencies: ['EUR', 'GBP', 'USD', 'CHF'],
  supportedSequenceTypes: ['oneoff', 'first', 'recurring'],
  amountBounds: [
    { currencyCode: 'EUR', minAmount: 100, maxAmount: null },
    { currencyCode: 'GBP', minAmount: null, maxAmount: 250000 },
  ],
};

/** A method restricted to a few countries, currencies, sequences, and a single amount bound. */
export const Restricted: Story = { args: { capability: restricted } };

/** Empty sets on every axis render as wildcard labels: Global, All currencies, all sequences, Unlimited. */
export const Wildcard: Story = { args: { capability: wildcard } };

/** More than three countries/currencies collapse into a "+N" overflow chip with a tooltip. */
export const Overflow: Story = { args: { capability: overflow } };

/** Standalone badge flagging an activation that predates capability snapshotting. */
export const PendingSnapshot: StoryObj<typeof PendingSnapshotBadge> = {
  render: () => <PendingSnapshotBadge />,
};

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CapabilityBadges capability={restricted} />
      <CapabilityBadges capability={wildcard} />
      <CapabilityBadges capability={overflow} />
      <PendingSnapshotBadge />
    </div>
  ),
};
