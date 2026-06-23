import { fn } from 'storybook/test';

import { VariableList } from './variable-list';

import type { Meta, StoryObj } from '@storybook/react-vite';

const groups = [
  {
    label: 'Global',
    items: [
      { name: 'now', type: 'DateTime', description: 'Current server time' },
      { name: 'culture', type: 'String', description: 'Active culture code' },
    ],
  },
  {
    label: 'Model',
    items: [
      { name: 'model.title', type: 'String', description: 'Document title' },
      { name: 'model.amount', type: 'Decimal', description: 'Invoice amount' },
      { name: 'model.dueDate', type: 'DateTime', description: null },
    ],
  },
] as const;

const meta: Meta<typeof VariableList> = {
  title: 'Features/Templates/VariableList',
  component: VariableList,
  tags: ['autodocs'],
  args: {
    groups,
    onSelectVariable: fn(),
    onInsertFunction: fn(),
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

export const Default: Story = {};

export const SingleGroup: Story = {
  args: {
    groups: [groups[0]],
  },
};
