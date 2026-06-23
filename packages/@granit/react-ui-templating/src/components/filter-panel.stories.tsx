import { fn } from 'storybook/test';

import { FilterPanel } from './filter-panel';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof FilterPanel> = {
  title: 'Features/Templates/FilterPanel',
  component: FilterPanel,
  tags: ['autodocs'],
  args: {
    variable: { name: 'model.title', type: 'String', description: 'Document title' },
    onInsertRaw: fn(),
    onInsertWithFilter: fn(),
    onBack: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-72 rounded-md border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const StringVariable: Story = {};

export const DateVariable: Story = {
  args: {
    variable: { name: 'model.dueDate', type: 'DateTime', description: 'Payment due date' },
  },
};

export const NumberVariable: Story = {
  args: {
    variable: { name: 'model.amount', type: 'Decimal', description: null },
  },
};
