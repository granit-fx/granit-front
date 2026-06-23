import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QueryControlBar } from '../querying/query-control-bar';

import { renderWithI18n, setupI18n } from './test-utils';

import type { GroupedResult, PagedResult, QueryMetadata, QueryRequest } from '@granit/query-engine';
import type { UseQueryEndpointReturn } from '@granit/react-query-engine';

interface Patient {
  readonly id: number;
}

const baseMeta: QueryMetadata = {
  columns: [
    {
      name: 'name',
      label: 'Name',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 1,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [],
  sortableFields: [{ name: 'name' }],
  presetFilterGroups: [
    {
      name: 'state',
      label: 'State',
      presets: [{ name: 'active', label: 'Active', isDefault: false }],
    },
  ],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [{ name: 'status', type: 'String' }],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10000,
    supportsCursor: false,
  },
};

interface EndpointOverrides {
  readonly params?: QueryRequest;
  readonly isGrouped?: boolean;
  readonly pagedTotal?: number;
  readonly groupedTotal?: number;
  readonly toggleSort?: ReturnType<typeof vi.fn>;
  readonly setGroupBy?: ReturnType<typeof vi.fn>;
  readonly setPresets?: ReturnType<typeof vi.fn>;
}

function makeEndpoint(overrides: EndpointOverrides = {}): UseQueryEndpointReturn<Patient> {
  const paged = { totalCount: overrides.pagedTotal ?? 7 } as PagedResult<Patient>;
  const grouped = { totalCount: overrides.groupedTotal ?? 3 } as GroupedResult<Patient>;
  const endpoint = {
    params: overrides.params ?? {},
    isGrouped: overrides.isGrouped ?? false,
    query: { data: paged },
    groupedQuery: { data: grouped },
    toggleSort: overrides.toggleSort ?? vi.fn(),
    setGroupBy: overrides.setGroupBy ?? vi.fn(),
    setPresets: overrides.setPresets ?? vi.fn(),
    setSearch: vi.fn(),
    setFilters: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    setQuickFilters: vi.fn(),
    reset: vi.fn(),
  };
  return endpoint as unknown as UseQueryEndpointReturn<Patient>;
}

beforeAll(setupI18n);

describe('QueryControlBar', () => {
  it('shows the paged total count with the record label', () => {
    renderWithI18n(
      <QueryControlBar
        meta={baseMeta}
        queryEndpoint={makeEndpoint({ pagedTotal: 7 })}
        recordLabel="patients"
      />
    );
    expect(screen.getByText(/7 patients/)).toBeInTheDocument();
  });

  it('uses the grouped total when grouped', () => {
    renderWithI18n(
      <QueryControlBar
        meta={baseMeta}
        queryEndpoint={makeEndpoint({ isGrouped: true, groupedTotal: 3 })}
        recordLabel="patients"
      />
    );
    expect(screen.getByText(/3 patients/)).toBeInTheDocument();
  });

  it('falls back to a zero count when the paged query has no data yet', () => {
    const endpoint = makeEndpoint();
    (endpoint as { query: { data: unknown } }).query = { data: undefined };
    renderWithI18n(
      <QueryControlBar meta={baseMeta} queryEndpoint={endpoint} recordLabel="patients" />
    );
    expect(screen.getByText(/0 patients/)).toBeInTheDocument();
  });

  it('falls back to a zero count when the grouped query has no data yet', () => {
    const endpoint = makeEndpoint({ isGrouped: true });
    (endpoint as { groupedQuery: { data: unknown } }).groupedQuery = { data: undefined };
    renderWithI18n(
      <QueryControlBar meta={baseMeta} queryEndpoint={endpoint} recordLabel="patients" />
    );
    expect(screen.getByText(/0 patients/)).toBeInTheDocument();
  });

  it('renders leading content', () => {
    renderWithI18n(
      <QueryControlBar
        meta={baseMeta}
        queryEndpoint={makeEndpoint()}
        recordLabel="patients"
        leading={<span>Lead slot</span>}
      />
    );
    expect(screen.getByText('Lead slot')).toBeInTheDocument();
  });

  it('renders preset filters and routes a toggle to the endpoint by default', async () => {
    const setPresets = vi.fn();
    renderWithI18n(
      <QueryControlBar
        meta={baseMeta}
        queryEndpoint={makeEndpoint({ setPresets })}
        recordLabel="patients"
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Active' }));
    expect(setPresets).toHaveBeenCalledWith('state', ['active']);
  });

  it('routes preset toggles to presetState when provided', async () => {
    const onToggle = vi.fn();
    const setPresets = vi.fn();
    renderWithI18n(
      <QueryControlBar
        meta={baseMeta}
        queryEndpoint={makeEndpoint({ setPresets })}
        recordLabel="patients"
        presetState={{ presets: {}, onToggle }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Active' }));
    expect(onToggle).toHaveBeenCalledWith('state', ['active']);
    expect(setPresets).not.toHaveBeenCalled();
  });

  it('hides the preset filters when meta exposes none', () => {
    const meta: QueryMetadata = { ...baseMeta, presetFilterGroups: [] };
    renderWithI18n(
      <QueryControlBar meta={meta} queryEndpoint={makeEndpoint()} recordLabel="patients" />
    );
    expect(screen.queryByRole('button', { name: 'Active' })).toBeNull();
  });

  it('renders the group-by selector and emits a chosen field', async () => {
    const setGroupBy = vi.fn();
    renderWithI18n(
      <QueryControlBar
        meta={baseMeta}
        queryEndpoint={makeEndpoint({ setGroupBy })}
        recordLabel="patients"
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /Group by/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Status' }));
    expect(setGroupBy).toHaveBeenCalledWith('status');
  });

  it('hides the group-by selector when meta exposes no group-by fields', () => {
    const meta: QueryMetadata = { ...baseMeta, groupByFields: [] };
    renderWithI18n(
      <QueryControlBar meta={meta} queryEndpoint={makeEndpoint()} recordLabel="patients" />
    );
    expect(screen.queryByRole('button', { name: /Group by/ })).toBeNull();
  });

  it('toggles a sortable column through the sort selector', async () => {
    const toggleSort = vi.fn();
    renderWithI18n(
      <QueryControlBar
        meta={baseMeta}
        queryEndpoint={makeEndpoint({ toggleSort })}
        recordLabel="patients"
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /Sort/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Name' }));
    expect(toggleSort).toHaveBeenCalledWith('name');
  });
});
