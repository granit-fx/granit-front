import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QueryDataTable } from '../querying/query-data-table/query-data-table';

import { renderWithI18n, setupI18n } from './test-utils';

import type { GroupEntry, SortEntry } from '@granit/query-engine';
import type { ColumnDef } from '@tanstack/react-table';


interface Row {
  readonly id: number;
  readonly name: string;
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'name', header: 'Name', id: 'name' },
];

const data: Row[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

beforeAll(setupI18n);

describe('QueryDataTable', () => {
  it('renders a row per data item', () => {
    renderWithI18n(<QueryDataTable<Row> columns={columns} data={data} totalCount={2} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows the empty state when there are no rows', () => {
    renderWithI18n(
      <QueryDataTable<Row>
        columns={columns}
        data={[]}
        totalCount={0}
        emptyMessage="Nothing here"
      />
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).toBeNull();
  });

  it('renders skeleton rows and no data while loading', () => {
    const { container } = renderWithI18n(
      <QueryDataTable<Row>
        columns={columns}
        data={data}
        totalCount={2}
        isLoading
        skeletonRows={3}
      />
    );
    expect(screen.queryByText('Alice')).toBeNull();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renders a sortable header that toggles sort with the column id', async () => {
    const onToggleSort = vi.fn();
    renderWithI18n(
      <QueryDataTable<Row>
        columns={columns}
        data={data}
        totalCount={2}
        onToggleSort={onToggleSort}
      />
    );
    const header = screen.getByRole('button', { name: /name/i });
    await userEvent.click(header);
    expect(onToggleSort).toHaveBeenCalledWith('name');
  });

  it('reflects the active sort direction on the header', () => {
    const sort: SortEntry[] = [{ field: 'name', direction: 'asc' }];
    const { container } = renderWithI18n(
      <QueryDataTable<Row>
        columns={columns}
        data={data}
        totalCount={2}
        sort={sort}
        onToggleSort={vi.fn()}
      />
    );
    const header = container.querySelector('[data-slot="sortable-header"]');
    expect(header).toHaveAttribute('data-sort-direction', 'asc');
  });

  it('renders pagination and advances the page', async () => {
    const onPageChange = vi.fn();
    renderWithI18n(
      <QueryDataTable<Row>
        columns={columns}
        data={data}
        totalCount={40}
        page={1}
        pageSize={20}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Pagination.NextPage' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('hides pagination when no page callbacks are supplied', () => {
    renderWithI18n(<QueryDataTable<Row> columns={columns} data={data} totalCount={40} />);
    expect(screen.queryByRole('button', { name: 'Pagination.NextPage' })).toBeNull();
  });

  it('renders grouped rows with their labels and counts', () => {
    const groups: GroupEntry<Row>[] = [
      {
        field: 'status',
        value: 'active',
        label: 'Active',
        count: 2,
        items: data,
      },
    ];
    const { container } = renderWithI18n(
      <QueryDataTable<Row> columns={columns} data={[]} groups={groups} totalCount={2} />
    );
    const groupHeader = container.querySelector('[data-slot="group-header"]');
    expect(groupHeader).not.toBeNull();
    expect(within(groupHeader as HTMLElement).getByText('Active')).toBeInTheDocument();
    expect(within(groupHeader as HTMLElement).getByText('(2)')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('collapses a group on header click', async () => {
    const groups: GroupEntry<Row>[] = [
      { field: 'status', value: 'active', label: 'Active', count: 2, items: data },
    ];
    const { container } = renderWithI18n(
      <QueryDataTable<Row> columns={columns} data={[]} groups={groups} totalCount={2} />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    await userEvent.click(container.querySelector('[data-slot="group-header"]') as HTMLElement);
    expect(screen.queryByText('Alice')).toBeNull();
  });

  it('shows the empty state when grouped data has no groups', () => {
    renderWithI18n(
      <QueryDataTable<Row>
        columns={columns}
        data={[]}
        groups={[]}
        totalCount={0}
        emptyMessage="No groups"
      />
    );
    expect(screen.getByText('No groups')).toBeInTheDocument();
  });
});
