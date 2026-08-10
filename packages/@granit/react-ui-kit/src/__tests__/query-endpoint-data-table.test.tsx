import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QueryEndpointDataTable } from '../querying/query-endpoint-data-table';

import { renderWithI18n, setupI18n } from './test-utils';

import type { DataTableColumnDef } from '../data-table/table-features';
import type { GroupedResult, PagedResult } from '@granit/query-engine';
import type { UseQueryEndpointReturn } from '@granit/react-query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

interface Row {
  readonly id: number;
  readonly name: string;
}

const columns: DataTableColumnDef<Row, unknown>[] = [
  { accessorKey: 'name', header: 'Name', id: 'name' },
];

function pagedQuery(
  overrides: Partial<UseQueryResult<PagedResult<Row>>> = {}
): UseQueryResult<PagedResult<Row>> {
  return {
    data: { items: [], totalCount: 0 },
    isLoading: false,
    ...overrides,
  } as unknown as UseQueryResult<PagedResult<Row>>;
}

function groupedQuery(
  overrides: Partial<UseQueryResult<GroupedResult<Row>>> = {}
): UseQueryResult<GroupedResult<Row>> {
  return {
    data: { groups: [], totalCount: 0 },
    isLoading: false,
    ...overrides,
  } as unknown as UseQueryResult<GroupedResult<Row>>;
}

function endpoint(
  overrides: Partial<UseQueryEndpointReturn<Row>> = {}
): UseQueryEndpointReturn<Row> {
  return {
    params: { page: 1, pageSize: 20 },
    isGrouped: false,
    query: pagedQuery(),
    groupedQuery: groupedQuery(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    setSearch: vi.fn(),
    setFilters: vi.fn(),
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    setSort: vi.fn(),
    toggleSort: vi.fn(),
    setPresets: vi.fn(),
    setQuickFilters: vi.fn(),
    toggleQuickFilter: vi.fn(),
    setGroupBy: vi.fn(),
    setParams: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  } as unknown as UseQueryEndpointReturn<Row>;
}

beforeAll(setupI18n);

describe('QueryEndpointDataTable', () => {
  it('renders paged rows from query.data in flat mode', () => {
    renderWithI18n(
      <QueryEndpointDataTable<Row>
        columns={columns}
        queryEndpoint={endpoint({
          query: pagedQuery({ data: { items: [{ id: 1, name: 'Alice' }], totalCount: 1 } }),
        })}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('forwards toggleSort from the endpoint dispatchers', async () => {
    const toggleSort = vi.fn();
    renderWithI18n(
      <QueryEndpointDataTable<Row>
        columns={columns}
        queryEndpoint={endpoint({
          toggleSort,
          query: pagedQuery({ data: { items: [{ id: 1, name: 'Alice' }], totalCount: 1 } }),
        })}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /name/i }));
    expect(toggleSort).toHaveBeenCalledWith('name');
  });

  it('forwards setPage when paginating', async () => {
    const setPage = vi.fn();
    renderWithI18n(
      <QueryEndpointDataTable<Row>
        columns={columns}
        queryEndpoint={endpoint({
          setPage,
          query: pagedQuery({ data: { items: [{ id: 1, name: 'Alice' }], totalCount: 60 } }),
        })}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Pagination.NextPage' }));
    expect(setPage).toHaveBeenCalledWith(2);
  });

  it('renders grouped data when isGrouped is true', () => {
    const { container } = renderWithI18n(
      <QueryEndpointDataTable<Row>
        columns={columns}
        queryEndpoint={endpoint({
          isGrouped: true,
          groupedQuery: groupedQuery({
            data: {
              groups: [
                {
                  field: 'status',
                  value: 'active',
                  label: 'Active',
                  count: 1,
                  items: [{ id: 1, name: 'Alice' }],
                },
              ],
              totalCount: 1,
            },
          }),
        })}
      />
    );
    expect(container.querySelector('[data-slot="group-header"]')).not.toBeNull();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows the loading skeletons when the active query is loading', () => {
    const { container } = renderWithI18n(
      <QueryEndpointDataTable<Row>
        columns={columns}
        queryEndpoint={endpoint({ query: pagedQuery({ isLoading: true, data: undefined }) })}
      />
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });
});
