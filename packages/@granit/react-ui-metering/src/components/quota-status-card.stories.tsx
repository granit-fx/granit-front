import { QuotaStatusCard } from './quota-status-card';

import type { MeteringQuotaStatusResponse } from '@granit/metering';
import type { Meta, StoryObj } from '@storybook/react-vite';

const base: MeteringQuotaStatusResponse = {
  meterName: 'api-calls',
  currentUsage: 4200,
  limit: 10000,
  percentUsed: 42,
  isExceeded: false,
};

const meta: Meta<typeof QuotaStatusCard> = {
  title: 'Metering/QuotaStatusCard',
  component: QuotaStatusCard,
  tags: ['autodocs'],
  args: { quota: base },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Healthy: Story = {};

export const Warning: Story = {
  args: { quota: { ...base, currentUsage: 8500, percentUsed: 85 } },
};

export const Exceeded: Story = {
  args: { quota: { ...base, currentUsage: 10500, percentUsed: 105, isExceeded: true } },
};

export const Unlimited: Story = {
  args: { quota: { ...base, limit: null, percentUsed: 0 } },
};
