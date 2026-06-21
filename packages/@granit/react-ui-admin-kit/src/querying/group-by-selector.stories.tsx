import { fn } from 'storybook/test';

import { GroupBySelector } from './group-by-selector';

import type { ColumnDefinition, GroupByField } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

const sampleFields: GroupByField[] = [
  { name: 'status' },
  { name: 'category' },
  { name: 'assignee' },
  { name: 'priority' },
];

const sampleColumns: ColumnDefinition[] = [
  { name: 'status', label: 'Status' },
  { name: 'category', label: 'Category' },
  { name: 'assignee', label: 'Assigned To' },
  { name: 'priority', label: 'Priority' },
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
    fields: [{ name: 'status' }],
    columns: [{ name: 'status', label: 'Status' }],
  },
};
