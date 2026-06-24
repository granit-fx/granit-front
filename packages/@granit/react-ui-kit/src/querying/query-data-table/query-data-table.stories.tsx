import { fn } from 'storybook/test';

import { QueryDataTable } from './query-data-table';

import type { GroupEntry } from '@granit/query-engine';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';

interface Country {
  readonly code: string;
  readonly labelEn: string;
  readonly region: string;
}

const columns: ColumnDef<Country, unknown>[] = [
  { id: 'code', accessorKey: 'code', header: 'Code', enableSorting: true },
  { id: 'labelEn', accessorKey: 'labelEn', header: 'Name', enableSorting: true },
  { id: 'region', accessorKey: 'region', header: 'Region' },
];

const rows: Country[] = [
  { code: 'FR', labelEn: 'France', region: 'Europe' },
  { code: 'DE', labelEn: 'Germany', region: 'Europe' },
  { code: 'JP', labelEn: 'Japan', region: 'Asia' },
  { code: 'BR', labelEn: 'Brazil', region: 'Americas' },
];

const groups: GroupEntry<Country>[] = [
  {
    field: 'region',
    value: 'Europe',
    label: 'Europe',
    count: 2,
    items: [rows[0]!, rows[1]!],
  },
  {
    field: 'region',
    value: 'Asia',
    label: 'Asia',
    count: 1,
    items: [rows[2]!],
  },
];

const meta = {
  title: 'Admin Kit/Querying/QueryDataTable',
  component: QueryDataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    columns,
    onPageChange: fn(),
    onPageSizeChange: fn(),
    onToggleSort: fn(),
  },
} satisfies Meta<typeof QueryDataTable<Country>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Paged rows with a sortable header on the Code/Name columns. */
export const Default: Story = {
  args: {
    data: rows,
    totalCount: 42,
    page: 1,
    pageSize: 20,
    sort: [{ field: 'labelEn', direction: 'asc' }],
  },
};

/** Loading — skeleton rows replace the body while the query is in flight. */
export const Loading: Story = {
  args: {
    data: [],
    totalCount: 0,
    isLoading: true,
    skeletonRows: 4,
  },
};

/** No rows — the empty-state row spans the table. */
export const Empty: Story = {
  args: {
    data: [],
    totalCount: 0,
    emptyMessage: 'No countries match your filters.',
  },
};

/** Grouped mode — collapsible group headers with their items inline. */
export const Grouped: Story = {
  args: {
    data: [],
    groups,
    totalCount: 3,
  },
};
