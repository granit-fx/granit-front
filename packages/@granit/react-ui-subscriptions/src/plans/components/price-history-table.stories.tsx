import { mockPlans } from '@granit/react-subscriptions/testing';

import { PriceHistoryTable } from './price-history-table';

import type { Meta, StoryObj } from '@storybook/react-vite';

const pricedPlan = mockPlans.find((plan) => plan.prices.length > 0);
const prices = [...(pricedPlan?.prices ?? [])];

const meta: Meta<typeof PriceHistoryTable> = {
  title: 'Features/Subscriptions/PriceHistoryTable',
  component: PriceHistoryTable,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHistory: Story = {
  args: { prices },
};

export const Empty: Story = {
  args: { prices: [] },
};

export const Loading: Story = {
  args: { prices: [], isLoading: true },
};
