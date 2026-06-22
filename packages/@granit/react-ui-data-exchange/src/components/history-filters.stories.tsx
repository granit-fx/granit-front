import { fn } from 'storybook/test';

import { HistoryFilters } from './history-filters';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof HistoryFilters> = {
  title: 'DataExchange/HistoryFilters',
  component: HistoryFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    mode: { control: 'inline-radio', options: ['import', 'export'] },
    onStatusChange: { action: 'onStatusChange' },
  },
};

export default meta;
type Story = StoryObj<typeof HistoryFilters>;

export const Import: Story = {
  args: {
    mode: 'import',
    status: undefined,
    onStatusChange: fn(),
  },
};

export const Export: Story = {
  args: {
    mode: 'export',
    status: undefined,
    onStatusChange: fn(),
  },
};

export const FilteredStatus: Story = {
  args: {
    mode: 'import',
    status: 'Completed',
    onStatusChange: fn(),
  },
};
