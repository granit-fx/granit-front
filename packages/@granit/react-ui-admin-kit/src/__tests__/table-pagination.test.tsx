import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TablePagination } from '../querying/query-data-table/table-pagination';
import { renderWithI18n, setupI18n } from './test-utils';

function setup(overrides: Partial<Parameters<typeof TablePagination>[0]> = {}) {
  const props = {
    page: 2,
    pageSize: 10,
    totalCount: 45,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<TablePagination {...props} />);
  return props;
}

beforeAll(setupI18n);

describe('TablePagination', () => {
  it('renders the four navigation buttons', () => {
    setup();
    expect(screen.getByLabelText('Pagination.FirstPage')).toBeInTheDocument();
    expect(screen.getByLabelText('Pagination.PreviousPage')).toBeInTheDocument();
    expect(screen.getByLabelText('Pagination.NextPage')).toBeInTheDocument();
    expect(screen.getByLabelText('Pagination.LastPage')).toBeInTheDocument();
  });

  it('disables first/previous on the first page', () => {
    setup({ page: 1 });
    expect(screen.getByLabelText('Pagination.FirstPage')).toBeDisabled();
    expect(screen.getByLabelText('Pagination.PreviousPage')).toBeDisabled();
    expect(screen.getByLabelText('Pagination.NextPage')).toBeEnabled();
    expect(screen.getByLabelText('Pagination.LastPage')).toBeEnabled();
  });

  it('disables next/last on the last page', () => {
    // 45 items / pageSize 10 → 5 pages.
    setup({ page: 5 });
    expect(screen.getByLabelText('Pagination.NextPage')).toBeDisabled();
    expect(screen.getByLabelText('Pagination.LastPage')).toBeDisabled();
    expect(screen.getByLabelText('Pagination.PreviousPage')).toBeEnabled();
  });

  it('navigates to the next and previous pages', async () => {
    const { onPageChange } = setup({ page: 2 });
    await userEvent.click(screen.getByLabelText('Pagination.NextPage'));
    expect(onPageChange).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByLabelText('Pagination.PreviousPage'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('jumps to the first and last pages', async () => {
    const { onPageChange } = setup({ page: 3, totalCount: 45, pageSize: 10 });
    await userEvent.click(screen.getByLabelText('Pagination.FirstPage'));
    expect(onPageChange).toHaveBeenCalledWith(1);
    await userEvent.click(screen.getByLabelText('Pagination.LastPage'));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('emits the chosen page size', async () => {
    const { onPageSizeChange } = setup({ pageSize: 10, pageSizeOptions: [10, 20, 50] });
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: '50' }));
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('treats an empty result set as a single page', () => {
    setup({ page: 1, totalCount: 0 });
    expect(screen.getByLabelText('Pagination.NextPage')).toBeDisabled();
    expect(screen.getByLabelText('Pagination.LastPage')).toBeDisabled();
  });
});
