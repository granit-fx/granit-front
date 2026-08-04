import { screen, waitFor } from '@testing-library/react';

import { PartiesListPage } from '../components/parties-list-page';

import { renderWithProviders } from './test-utils';

import type { PartyListItemResponse } from '@granit/parties';
import type { FilterEntry } from '@granit/query-engine';
import type { ReactNode } from 'react';
import type * as RouterDom from 'react-router';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof RouterDom>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

// The list grid is driven by the query-engine binding `usePartiesListQuery`
// under a `PartiesListProvider`. Stub both: the provider is a pass-through and
// the hook returns the `useQueryEndpoint` shape so the page renders without a
// real `<QueryProvider>` / axios client.
const mockSetFilters = vi.fn();
const mockUsePartiesListQuery = vi.fn();
vi.mock('@granit/react-parties', () => ({
  PartiesListProvider: ({ children }: { readonly children: ReactNode }) => children,
  usePartiesListQuery: () => mockUsePartiesListQuery(),
}));

interface QueryEndpointStub {
  readonly items?: readonly PartyListItemResponse[];
  readonly totalCount?: number;
  readonly isLoading?: boolean;
  readonly filters?: readonly FilterEntry[];
}

function makeQueryEndpoint({
  items = [],
  totalCount = items.length,
  isLoading = false,
  filters = [],
}: QueryEndpointStub = {}) {
  return {
    query: { data: { items, totalCount }, isLoading },
    groupedQuery: { data: undefined, isLoading: false },
    isGrouped: false,
    params: { page: 1, pageSize: 20, filters },
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    setFilters: mockSetFilters,
    toggleSort: vi.fn(),
  };
}

const acme: PartyListItemResponse = {
  id: 'p1' as PartyListItemResponse['id'],
  tenantId: null,
  kind: 'Company',
  name: 'Acme Corp',
  roles: 'Customer',
  status: 'Active',
  defaultCurrency: 'EUR',
  primaryEmail: 'billing@acme.example',
  primaryPhone: null,
};

describe('PartiesListPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSetFilters.mockClear();
    mockUsePartiesListQuery.mockReset();
  });

  it('renders the title and subtitle', () => {
    mockUsePartiesListQuery.mockReturnValue(makeQueryEndpoint());
    renderWithProviders(<PartiesListPage />);
    expect(screen.getByRole('heading', { name: 'Parties' })).toBeInTheDocument();
  });

  it('shows the empty-state when no parties match', () => {
    mockUsePartiesListQuery.mockReturnValue(makeQueryEndpoint());
    const { container } = renderWithProviders(<PartiesListPage />);
    expect(container.querySelector('[data-slot="empty-state"]')).toBeInTheDocument();
  });

  it('renders party rows from the query', () => {
    mockUsePartiesListQuery.mockReturnValue(makeQueryEndpoint({ items: [acme] }));
    renderWithProviders(<PartiesListPage />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('billing@acme.example')).toBeInTheDocument();
  });

  it('renders skeletons while loading', () => {
    mockUsePartiesListQuery.mockReturnValue(makeQueryEndpoint({ isLoading: true }));
    const { container } = renderWithProviders(<PartiesListPage />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('navigates to the create page', async () => {
    mockUsePartiesListQuery.mockReturnValue(makeQueryEndpoint());
    const { user } = renderWithProviders(<PartiesListPage />);
    await user.click(screen.getByRole('button', { name: 'New party' }));
    expect(mockNavigate).toHaveBeenCalledWith('/parties/new');
  });

  it('drives the role dropdown through the query-engine `roles` filter', async () => {
    mockUsePartiesListQuery.mockReturnValue(makeQueryEndpoint());
    const { user } = renderWithProviders(<PartiesListPage />);
    await user.click(screen.getByRole('combobox', { name: 'Filter by role' }));
    await user.click(await screen.findByRole('option', { name: 'Supplier' }));
    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenLastCalledWith([
        { field: 'roles', operator: 'Eq', value: 'Supplier' },
      ]);
    });
  });

  it('clears the role filter when "All" is re-selected', async () => {
    mockUsePartiesListQuery.mockReturnValue(
      makeQueryEndpoint({ filters: [{ field: 'roles', operator: 'Eq', value: 'Supplier' }] })
    );
    const { user } = renderWithProviders(<PartiesListPage />);
    await user.click(screen.getByRole('combobox', { name: 'Filter by role' }));
    await user.click(await screen.findByRole('option', { name: 'All' }));
    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenLastCalledWith([]);
    });
  });

  it('drives the status dropdown through the query-engine `status` filter', async () => {
    mockUsePartiesListQuery.mockReturnValue(makeQueryEndpoint());
    const { user } = renderWithProviders(<PartiesListPage />);
    await user.click(screen.getByRole('combobox', { name: 'Filter by status' }));
    await user.click(await screen.findByRole('option', { name: 'Archived' }));
    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenLastCalledWith([
        { field: 'status', operator: 'Eq', value: 'Archived' },
      ]);
    });
  });

  it('drives the search input through the query-engine `name` filter', async () => {
    // The Input is controlled by `params.filters` (stubbed static here), so each
    // keystroke reports its own char — type a single character and assert the
    // resulting Contains filter rather than an accumulated term.
    mockUsePartiesListQuery.mockReturnValue(makeQueryEndpoint());
    const { user } = renderWithProviders(<PartiesListPage />);
    await user.type(screen.getByLabelText('Search by name…'), 'g');
    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenLastCalledWith([
        { field: 'name', operator: 'Contains', value: 'g' },
      ]);
    });
  });
});
