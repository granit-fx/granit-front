import { BalanceSummaryCard } from './balance-summary-card';

import type { CustomerBalanceResponse } from '@granit/customer-balance';
import type { Meta, StoryObj } from '@storybook/react-vite';

const balance: CustomerBalanceResponse = {
  balanceAccountId: '55555555-5555-5555-5555-555555555555',
  currency: 'EUR',
  balance: 12550,
  concurrencyStamp: 'abc123',
  updatedAt: '2026-06-20T14:30:00Z',
};

const meta: Meta<typeof BalanceSummaryCard> = {
  title: 'CustomerBalance/BalanceSummaryCard',
  component: BalanceSummaryCard,
  tags: ['autodocs'],
  args: { balance },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Positive: Story = {};

export const Zero: Story = {
  args: { balance: { ...balance, balance: 0 } },
};

export const Negative: Story = {
  args: { balance: { ...balance, balance: -4200, updatedAt: null } },
};
