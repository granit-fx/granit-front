import { useState } from 'react';

import { ManualDataTable } from './manual-data-table';

import type { DataTableColumnDef } from './table-features';
import type { Meta, StoryObj } from '@storybook/react-vite';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
}

const columns: DataTableColumnDef<Person, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
];

const ALL_ROWS: readonly Person[] = Array.from({ length: 23 }, (_, i) => ({
  id: `u-${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 3 === 0 ? 'Admin' : 'Member',
}));

const PAGE_SIZES = [5, 10, 20] as const;

/**
 * Interactive wrapper so the pagination controls actually page through the
 * fixture rows — the component is server-paginated (the host owns
 * `page`/`pageSize`/`totalCount`), so the story slices the data itself.
 */
function ManualDataTableDemo({ rows }: { readonly rows: readonly Person[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <ManualDataTable
      columns={columns}
      data={pageRows}
      totalCount={rows.length}
      page={page}
      pageSize={pageSize}
      pageSizes={PAGE_SIZES}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
    />
  );
}

// `component` is instantiated with `Person` so the story props resolve to the
// fixture row type rather than to `RowData`, the constraint TanStack Table v9
// puts on `TData`. The `args` defaults cover every required prop, which is what
// lets the `render`-only stories below type-check.
const meta = {
  title: 'Admin Kit/DataTable/ManualDataTable',
  component: ManualDataTable<Person>,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    columns,
    data: ALL_ROWS,
    totalCount: ALL_ROWS.length,
    page: 1,
    pageSize: PAGE_SIZES[0],
    pageSizes: PAGE_SIZES,
    onPageChange: () => {},
    onPageSizeChange: () => {},
  },
} satisfies Meta<typeof ManualDataTable<Person>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Paginated list — use the page-size select and Previous/Next to navigate. */
export const Default: Story = {
  render: () => <ManualDataTableDemo rows={ALL_ROWS} />,
};

/** A single page of results: the pagination bar can be hidden. */
export const SinglePage: Story = {
  render: () => (
    <ManualDataTable
      columns={columns}
      data={ALL_ROWS.slice(0, 3)}
      totalCount={3}
      page={1}
      pageSize={10}
      pageSizes={PAGE_SIZES}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
      hidePaginationOnSinglePage
    />
  ),
};

/** No rows — the table renders its empty-state row. */
export const Empty: Story = {
  render: () => (
    <ManualDataTable
      columns={columns}
      data={[]}
      totalCount={0}
      page={1}
      pageSize={10}
      pageSizes={PAGE_SIZES}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
    />
  ),
};
