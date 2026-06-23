import { screen } from '@testing-library/react';

import { PartiesListPage } from '../parties-list-page';

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
});
