import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ManualDataTable } from '../data-table/manual-data-table';

import { renderWithI18n, setupI18n } from './test-utils';

import type { ColumnDef } from '@tanstack/react-table';

interface Row {
  id: number;
  name: string;
}

const columns: ColumnDef<Row, unknown>[] = [{ accessorKey: 'name', header: 'Name' }];

function setup(overrides: Partial<Parameters<typeof ManualDataTable<Row>>[0]> = {}) {
  const props = {
    columns,
    data: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
    totalCount: 12,
    page: 1,
    pageSize: 10,
    pageSizes: [10, 25],
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<ManualDataTable<Row> {...props} />);
  return props;
}

beforeAll(setupI18n);

describe('ManualDataTable', () => {
  it('renders a row per data item', () => {
    setup();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows the empty placeholder when there is no data', () => {
    setup({ data: [], totalCount: 0 });
    expect(screen.queryByText('Alice')).toBeNull();
  });

  it('disables Previous on the first page and Next near the last', async () => {
    const { onPageChange } = setup({ page: 1, totalCount: 12, pageSize: 10 });
    const prev = screen.getByRole('button', { name: /previous/i });
    const next = screen.getByRole('button', { name: /next/i });
    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();
    await userEvent.click(next);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('hides pagination on a single page when requested', () => {
    setup({ totalCount: 5, pageSize: 10, hidePaginationOnSinglePage: true });
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull();
  });
});
