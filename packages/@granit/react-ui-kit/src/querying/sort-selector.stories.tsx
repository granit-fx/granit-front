import { fn } from 'storybook/test';

import { SortSelector } from './sort-selector';

import type { ColumnDefinition, SortEntry } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

const sortableColumns: ColumnDefinition[] = [
  { name: 'name', label: 'Name', isSortable: true },
  { name: 'createdAt', label: 'Created At', isSortable: true },
  { name: 'status', label: 'Status', isSortable: true },
];

const mixedColumns: ColumnDefinition[] = [
  { name: 'name', label: 'Name', isSortable: true },
  { name: 'description', label: 'Description', isSortable: false },
  { name: 'createdAt', label: 'Created At', isSortable: true },
];

const sortAsc: SortEntry[] = [{ field: 'name', direction: 'asc' }];
const sortDesc: SortEntry[] = [{ field: 'createdAt', direction: 'desc' }];

const meta = {
  title: 'Admin Kit/SortSelector',
  component: SortSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onToggleSort: fn(),
  },
} satisfies Meta<typeof SortSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    columns: sortableColumns,
    sort: undefined,
  },
};

export const SortedAscending: Story = {
  args: {
    columns: sortableColumns,
    sort: sortAsc,
  },
};

export const SortedDescending: Story = {
  args: {
    columns: sortableColumns,
    sort: sortDesc,
  },
};

export const MixedColumns: Story = {
  name: 'Mixed Sortable/Non-Sortable Columns',
  args: {
    columns: mixedColumns,
    sort: undefined,
  },
};
