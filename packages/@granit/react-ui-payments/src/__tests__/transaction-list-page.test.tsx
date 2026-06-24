import { sampleTransactions } from '@granit/react-payments/testing';
import { screen, waitFor } from '@testing-library/react';

import { TransactionListPage } from '../components/transaction-list-page';

import { renderWithProviders } from './test-utils';

import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Mocks — the transaction list now rides the query engine. Stub
// usePaymentTransactionsQuery with the UseQueryEndpointReturn surface so the
// admin-kit grid renders rows deterministically, and pass-through the
// PaymentTransactionsProvider (it would otherwise require a PaymentsProvider +
// QueryProvider the unit test does not mount).
// ---------------------------------------------------------------------------

const { mockUsePaymentTransactionsQuery } = vi.hoisted(() => ({
  mockUsePaymentTransactionsQuery: vi.fn(),
}));

// Build the query-engine surface returned by usePaymentTransactionsQuery
// (UseQueryEndpointReturn): the paged grid reads `query.data.{items,totalCount}`.
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

vi.mock('@granit/react-payments', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    PaymentTransactionsProvider: ({ children }: { readonly children: ReactNode }) => children,
    usePaymentTransactionsQuery: mockUsePaymentTransactionsQuery,
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
    mockUsePaymentTransactionsQuery.mockReturnValue(queryEndpoint(pagedResult, false));
    renderWithProviders(<TransactionListPage />);
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('View payment transactions')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="transaction-list-page"]')).toBeInTheDocument();
  });

  it('should render the column headers', () => {
    mockUsePaymentTransactionsQuery.mockReturnValue(queryEndpoint(pagedResult, false));
    renderWithProviders(<TransactionListPage />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
  });

  it('should render a row per transaction', () => {
    mockUsePaymentTransactionsQuery.mockReturnValue(queryEndpoint(pagedResult, false));
    renderWithProviders(<TransactionListPage />);
    // id cell renders the first 12 chars + ellipsis
    expect(screen.getByText('txn_4kLm8nPq...')).toBeInTheDocument();
    expect(screen.getByText('txn_2gHiJkLm...')).toBeInTheDocument();
    expect(screen.getAllByText('Stripe').length).toBeGreaterThanOrEqual(2);
  });

  it('should render the charge button', () => {
    mockUsePaymentTransactionsQuery.mockReturnValue(queryEndpoint(pagedResult, false));
    renderWithProviders(<TransactionListPage />);
    expect(screen.getByText('Charge')).toBeInTheDocument();
  });

  it('should render the grid empty state when there are no transactions', () => {
    mockUsePaymentTransactionsQuery.mockReturnValue(
      queryEndpoint({ ...pagedResult, items: [], totalCount: 0 }, false)
    );
    renderWithProviders(<TransactionListPage />);
    // The admin-kit grid renders its own empty state; no transaction rows.
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.queryByText('txn_4kLm8nPq...')).not.toBeInTheDocument();
  });

  it('should render loading skeletons while transactions load', () => {
    mockUsePaymentTransactionsQuery.mockReturnValue(queryEndpoint(undefined, true));
    renderWithProviders(<TransactionListPage />);
    // The grid is still mounted (headers stay) but rows are skeletons, not data.
    expect(document.querySelector('[data-slot="query-data-table"]')).toBeInTheDocument();
    expect(screen.queryByText('txn_4kLm8nPq...')).not.toBeInTheDocument();
  });

  it('should keep the title visible after data settles', async () => {
    mockUsePaymentTransactionsQuery.mockReturnValue(queryEndpoint(pagedResult, false));
    renderWithProviders(<TransactionListPage />);
    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });
  });
});
