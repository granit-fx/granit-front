import { screen, waitFor } from '@testing-library/react';

import { PartiesListPage } from '../components/parties-list-page';

import { renderWithProviders } from './test-utils';

import type * as RouterDom from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof RouterDom>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUsePartiesQuery = vi.fn();
vi.mock('@granit/react-parties', () => ({
  usePartiesQuery: (options?: unknown) => mockUsePartiesQuery(options),
}));

describe('PartiesListPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUsePartiesQuery.mockReset();
  });

  it('renders the title and subtitle', () => {
    mockUsePartiesQuery.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<PartiesListPage />);
    expect(screen.getByRole('heading', { name: 'Parties' })).toBeInTheDocument();
  });

  it('shows the empty-state message when no parties match', () => {
    mockUsePartiesQuery.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<PartiesListPage />);
    expect(screen.getByText('No parties match your filters.')).toBeInTheDocument();
  });

  it('renders party rows from the query', () => {
    mockUsePartiesQuery.mockReturnValue({
      data: [
        {
          id: 'p1',
          tenantId: null,
          kind: 'Company',
          name: 'Acme Corp',
          roles: 'Customer',
          status: 'Active',
          defaultCurrency: 'EUR',
          primaryEmail: 'billing@acme.example',
          primaryPhone: null,
        },
      ],
      isLoading: false,
    });
    renderWithProviders(<PartiesListPage />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('billing@acme.example')).toBeInTheDocument();
  });

  it('renders skeletons while loading', () => {
    mockUsePartiesQuery.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderWithProviders(<PartiesListPage />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('navigates to the create page', async () => {
    mockUsePartiesQuery.mockReturnValue({ data: [], isLoading: false });
    const { user } = renderWithProviders(<PartiesListPage />);
    await user.click(screen.getByRole('button', { name: 'New party' }));
    expect(mockNavigate).toHaveBeenCalledWith('/parties/new');
  });

  it('filters the rows by the search term', async () => {
    mockUsePartiesQuery.mockReturnValue({
      data: [
        {
          id: 'p1',
          tenantId: null,
          kind: 'Company',
          name: 'Acme Corp',
          roles: 'Customer',
          status: 'Active',
          defaultCurrency: 'EUR',
          primaryEmail: null,
          primaryPhone: null,
        },
        {
          id: 'p2',
          tenantId: null,
          kind: 'Company',
          name: 'Globex Inc',
          roles: 'Customer',
          status: 'Active',
          defaultCurrency: 'USD',
          primaryEmail: null,
          primaryPhone: null,
        },
      ],
      isLoading: false,
    });
    const { user } = renderWithProviders(<PartiesListPage />);
    await user.type(screen.getByLabelText('Search by name…'), 'globex');
    expect(screen.getByText('Globex Inc')).toBeInTheDocument();
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
  });

  it('filters by status', async () => {
    mockUsePartiesQuery.mockReturnValue({
      data: [
        {
          id: 'p1',
          tenantId: null,
          kind: 'Company',
          name: 'Acme Corp',
          roles: 'Customer',
          status: 'Active',
          defaultCurrency: 'EUR',
          primaryEmail: null,
          primaryPhone: null,
        },
        {
          id: 'p2',
          tenantId: null,
          kind: 'Company',
          name: 'Old Co',
          roles: 'Customer',
          status: 'Archived',
          defaultCurrency: 'EUR',
          primaryEmail: null,
          primaryPhone: null,
        },
      ],
      isLoading: false,
    });
    const { user } = renderWithProviders(<PartiesListPage />);
    await user.click(screen.getByRole('combobox', { name: 'Filter by status' }));
    await user.click(await screen.findByRole('option', { name: 'Archived' }));
    expect(screen.getByText('Old Co')).toBeInTheDocument();
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
  });

  it('requests the query scoped by the selected role filter', async () => {
    mockUsePartiesQuery.mockReturnValue({ data: [], isLoading: false });
    const { user } = renderWithProviders(<PartiesListPage />);
    await user.click(screen.getByRole('combobox', { name: 'Filter by role' }));
    await user.click(await screen.findByRole('option', { name: 'Supplier' }));
    await waitFor(() => {
      expect(mockUsePartiesQuery).toHaveBeenLastCalledWith({ role: 'Supplier' });
    });
  });
});
