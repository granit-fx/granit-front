import { fn } from 'storybook/test';

import { DatePeriodPicker } from './date-period-picker';

import type { DateFilterMeta, DatePeriod } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

const allPeriodsMeta: DateFilterMeta = {
  defaultPeriod: 'ThisMonth',
  availablePeriods: [
    'Today',
    'ThisWeek',
    'ThisMonth',
    'LastMonth',
    'ThisQuarter',
    'ThisYear',
    'Custom',
  ],
};

const limitedPeriodsMeta: DateFilterMeta = {
  defaultPeriod: 'Today',
  availablePeriods: ['Today', 'ThisWeek', 'ThisMonth'],
};

const meta = {
  title: 'Admin Kit/DatePeriodPicker',
  component: DatePeriodPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onValueChange: fn(),
  },
} satisfies Meta<typeof DatePeriodPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    dateFilter: allPeriodsMeta,
    value: 'ThisMonth',
  },
};

export const AllPeriods: Story = {
  args: {
    dateFilter: allPeriodsMeta,
    value: 'ThisYear',
  },
};

export const LimitedPeriods: Story = {
  args: {
    dateFilter: limitedPeriodsMeta,
    value: 'Today',
  },
};

export const NoPreselectedValue: Story = {
  args: {
    dateFilter: allPeriodsMeta,
    value: undefined,
  },
};

export const CustomSelected: Story = {
  args: {
    dateFilter: allPeriodsMeta,
    value: 'Custom' as DatePeriod,
  },
};
