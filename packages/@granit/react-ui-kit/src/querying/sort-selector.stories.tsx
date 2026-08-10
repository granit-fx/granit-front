import { fn } from 'storybook/test';

import { SortSelector } from './sort-selector';

import type { ColumnDefinition, SortEntry } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';

// `ColumnDefinition` mirrors the backend query-metadata contract, so a fixture
// has to carry the full shape. `isSortable` is the only part this selector
// reads; the builder fills in the rest.
const column = (
  name: string,
  label: string,
  order: number,
  isSortable: boolean
): ColumnDefinition => ({
  name,
  label,
  type: name === 'createdAt' ? 'DateTime' : 'String',
  order,
  isSortable,
  isFilterable: true,
  isVisible: true,
});

const sortableColumns: ColumnDefinition[] = [
  column('name', 'Name', 0, true),
  column('createdAt', 'Created At', 1, true),
  column('status', 'Status', 2, true),
];

const mixedColumns: ColumnDefinition[] = [
  column('name', 'Name', 0, true),
  column('description', 'Description', 1, false),
  column('createdAt', 'Created At', 2, true),
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
