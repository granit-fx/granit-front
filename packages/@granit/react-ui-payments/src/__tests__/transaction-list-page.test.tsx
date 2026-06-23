import { sampleTransactions } from '@granit/react-payments/testing';
import { screen, waitFor } from '@testing-library/react';

import { TransactionListPage } from '../transaction-list-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Mocks — stub the paginated transactions query hook (usePaymentTransactions
// → PagedResult) so rows render deterministically.
// ---------------------------------------------------------------------------

const { mockUsePaymentTransactions } = vi.hoisted(() => ({
  mockUsePaymentTransactions: vi.fn(),
}));

vi.mock('@granit/react-payments', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePaymentTransactions: mockUsePaymentTransactions,
    useInitiatePaymentCharge: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const pagedResult = {
  items: sampleTransactions,
  totalCount: sampleTransactions.length,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

describe('TransactionListPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('should render the title, subtitle and data-slot', () => {
    mockUsePaymentTransactions.mockReturnValue({ data: pagedResult, isLoading: false });
    renderWithProviders(<TransactionListPage />);
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('View payment transactions')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="transaction-list-page"]')).toBeInTheDocument();
  });

  it('should render the column headers', () => {
    mockUsePaymentTransactions.mockReturnValue({ data: pagedResult, isLoading: false });
    renderWithProviders(<TransactionListPage />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
  });

  it('should render a row per transaction', () => {
    mockUsePaymentTransactions.mockReturnValue({ data: pagedResult, isLoading: false });
    renderWithProviders(<TransactionListPage />);
    // id cell renders the first 12 chars + ellipsis
    expect(screen.getByText('txn_4kLm8nPq...')).toBeInTheDocument();
    expect(screen.getByText('txn_2gHiJkLm...')).toBeInTheDocument();
    expect(screen.getAllByText('Stripe').length).toBeGreaterThanOrEqual(2);
  });

  it('should render the charge button', () => {
    mockUsePaymentTransactions.mockReturnValue({ data: pagedResult, isLoading: false });
    renderWithProviders(<TransactionListPage />);
    expect(screen.getByText('Charge')).toBeInTheDocument();
  });

  it('should render the empty state when there are no transactions', () => {
    mockUsePaymentTransactions.mockReturnValue({
      data: { ...pagedResult, items: [], totalCount: 0 },
      isLoading: false,
    });
    renderWithProviders(<TransactionListPage />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('should render the loading spinner', () => {
    mockUsePaymentTransactions.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<TransactionListPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should keep the title visible after data settles', async () => {
    mockUsePaymentTransactions.mockReturnValue({ data: pagedResult, isLoading: false });
    renderWithProviders(<TransactionListPage />);
    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });
  });
});
