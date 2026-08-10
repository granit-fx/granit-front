import { fn } from 'storybook/test';

import { GroupBySelector } from './group-by-selector';

import type { ColumnDefinition, GroupByField } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

// `GroupByField` and `ColumnDefinition` mirror the backend query-metadata
// contract, so a fixture has to carry the full shape. These builders keep the
// stories readable while filling in the parts the selector does not read.
const field = (name: string): GroupByField => ({ name, type: 'String' });

const column = (name: string, label: string, order: number): ColumnDefinition => ({
  name,
  label,
  type: 'String',
  order,
  isSortable: true,
  isFilterable: true,
  isVisible: true,
});

const sampleFields: GroupByField[] = [
  field('status'),
  field('category'),
  field('assignee'),
  field('priority'),
];

const sampleColumns: ColumnDefinition[] = [
  column('status', 'Status', 0),
  column('category', 'Category', 1),
  column('assignee', 'Assigned To', 2),
  column('priority', 'Priority', 3),
];

const meta = {
  title: 'Admin Kit/GroupBySelector',
  component: GroupBySelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onValueChange: fn(),
  },
} satisfies Meta<typeof GroupBySelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fields: sampleFields,
    columns: sampleColumns,
  },
};

export const WithSelection: Story = {
  args: {
    fields: sampleFields,
    columns: sampleColumns,
    value: 'status',
  },
};

export const WithoutColumnLabels: Story = {
  args: {
    fields: sampleFields,
  },
};

export const SingleField: Story = {
  args: {
    fields: [field('status')],
    columns: [column('status', 'Status', 0)],
  },
};
