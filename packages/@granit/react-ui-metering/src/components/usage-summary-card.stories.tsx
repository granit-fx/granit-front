import { UsageSummaryCard } from './usage-summary-card';

import type { UsageAggregateResponse } from '@granit/metering';
import type { Meta, StoryObj } from '@storybook/react-vite';

const usage: UsageAggregateResponse = {
  id: '33333333-3333-3333-3333-333333333333',
  meterDefinitionId: '44444444-4444-4444-4444-444444444444',
  period: 'BillingPeriod',
  periodStart: '2026-06-01T00:00:00Z',
  periodEnd: '2026-06-30T23:59:59Z',
  aggregatedValue: 128450,
  eventCount: 9321,
};

const meta: Meta<typeof UsageSummaryCard> = {
  title: 'Metering/UsageSummaryCard',
  component: UsageSummaryCard,
  tags: ['autodocs'],
  args: { usage },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Daily: Story = {
  args: { usage: { ...usage, period: 'Daily', aggregatedValue: 412, eventCount: 412 } },
};
