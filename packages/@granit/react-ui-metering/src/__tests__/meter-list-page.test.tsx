import { screen, waitFor } from '@testing-library/react';

import { MeterListPage } from '../components/meter-list-page';

import { renderWithProviders } from './test-utils';

import type { MeterDefinitionResponse } from '@granit/metering';

// ---------------------------------------------------------------------------
// Mocks — the page now consumes the query-engine surface (useMetersQuery,
// UseQueryEndpointReturn) instead of the Published-only useActiveMeters array.
// ---------------------------------------------------------------------------

const mockMeters: readonly MeterDefinitionResponse[] = [
  {
    id: 'meter-1',
    name: 'API Requests',
    description: 'Tracks API usage',
    aggregationType: 'Sum',
    unit: 'requests',
    productId: null,
    lifecycleStatus: 'Published',
    distinctProperty: null,
  },
  {
    id: 'meter-2',
    name: 'Active Users',
    description: 'Monthly active users',
    aggregationType: 'Max',
    unit: 'users',
    productId: null,
    lifecycleStatus: 'Draft',
    distinctProperty: null,
  },
];

const { mockUseMetersQuery } = vi.hoisted(() => ({
  mockUseMetersQuery: vi.fn(),
}));

// Build the query-engine surface returned by useMetersQuery (UseQueryEndpointReturn).
function queryEndpoint(data: unknown, isLoading: boolean) {
  return {
    query: { data, isLoading },
    params: {},
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
    isGrouped: false,
    groupedQuery: { data: undefined, isLoading: false },
  };
}

vi.mock('@granit/react-metering', () => ({
  useMetersQuery: mockUseMetersQuery,
  useCreateMeterDefinition: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('MeterListPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders the page title', () => {
    mockUseMetersQuery.mockReturnValue(
      queryEndpoint({ items: mockMeters, totalCount: mockMeters.length }, false)
    );
    renderWithProviders(<MeterListPage />);
    expect(screen.getByText('Metering')).toBeInTheDocument();
  });

  it('renders the page subtitle', () => {
    mockUseMetersQuery.mockReturnValue(
      queryEndpoint({ items: mockMeters, totalCount: mockMeters.length }, false)
    );
    renderWithProviders(<MeterListPage />);
    expect(screen.getByText('Manage metering definitions')).toBeInTheDocument();
  });

  it('renders the create button', () => {
    mockUseMetersQuery.mockReturnValue(
      queryEndpoint({ items: mockMeters, totalCount: mockMeters.length }, false)
    );
    renderWithProviders(<MeterListPage />);
    expect(screen.getByText('Create Meter')).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    mockUseMetersQuery.mockReturnValue(
      queryEndpoint({ items: mockMeters, totalCount: mockMeters.length }, false)
    );
    renderWithProviders(<MeterListPage />);
    expect(document.querySelector('[data-slot="meter-list-page"]')).toBeInTheDocument();
  });

  it('renders the column headers', async () => {
    mockUseMetersQuery.mockReturnValue(
      queryEndpoint({ items: mockMeters, totalCount: mockMeters.length }, false)
    );
    renderWithProviders(<MeterListPage />);
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
    expect(screen.getByText('Aggregation Type')).toBeInTheDocument();
    expect(screen.getByText('Unit')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders a row per meter — including non-Published (all meters, paginated)', async () => {
    mockUseMetersQuery.mockReturnValue(
      queryEndpoint({ items: mockMeters, totalCount: mockMeters.length }, false)
    );
    renderWithProviders(<MeterListPage />);
    await waitFor(() => {
      expect(screen.getByText('API Requests')).toBeInTheDocument();
    });
    // The Draft meter is now listed — the grid shows ALL meters, not just active.
    expect(screen.getByText('Active Users')).toBeInTheDocument();
  });

  it('renders the query grid with no data rows when there are no meters', async () => {
    mockUseMetersQuery.mockReturnValue(queryEndpoint({ items: [], totalCount: 0 }, false));
    renderWithProviders(<MeterListPage />);
    await waitFor(() => {
      expect(screen.queryByText('API Requests')).not.toBeInTheDocument();
    });
  });
});
