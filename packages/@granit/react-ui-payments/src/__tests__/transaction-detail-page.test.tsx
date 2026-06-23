import { sampleTransactions } from '@granit/react-payments/testing';
import { screen, waitFor } from '@testing-library/react';

import { TransactionDetailPage } from '../transaction-detail-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Mocks — useParams (route id) + the single-transaction fetch hook.
// ---------------------------------------------------------------------------

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useParams: mockUseParams,
  };
});

const { mockUsePaymentTransaction } = vi.hoisted(() => ({
  mockUsePaymentTransaction: vi.fn(),
}));

vi.mock('@granit/react-payments', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePaymentTransaction: mockUsePaymentTransaction,
    useRequestPaymentRefund: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const mockTransaction = sampleTransactions[0]!;

describe('TransactionDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: 'txn_4kLm8nPqRs' });
  });

  afterEach(() => vi.clearAllMocks());

  it('should render the loading spinner', () => {
    mockUsePaymentTransaction.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<TransactionDetailPage />, {
      route: '/payments/transactions/txn_4kLm8nPqRs',
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render the not-found state when the transaction is missing', () => {
    mockUsePaymentTransaction.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<TransactionDetailPage />, {
      route: '/payments/transactions/txn_4kLm8nPqRs',
    });
    expect(screen.getByText('Transaction not found')).toBeInTheDocument();
  });

  it('should render the transaction details and data-slot', () => {
    mockUsePaymentTransaction.mockReturnValue({ data: mockTransaction, isLoading: false });
    renderWithProviders(<TransactionDetailPage />, {
      route: '/payments/transactions/txn_4kLm8nPqRs',
    });
    expect(document.querySelector('[data-slot="transaction-detail-page"]')).toBeInTheDocument();
    expect(screen.getByText('Transaction Details')).toBeInTheDocument();
    expect(screen.getByText('txn_4kLm8nPqRs')).toBeInTheDocument();
    expect(screen.getByText('Stripe')).toBeInTheDocument();
  });

  it('should render the status badge', () => {
    mockUsePaymentTransaction.mockReturnValue({ data: mockTransaction, isLoading: false });
    renderWithProviders(<TransactionDetailPage />, {
      route: '/payments/transactions/txn_4kLm8nPqRs',
    });
    const badge = document.querySelector('[data-slot="transaction-status-badge"]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Succeeded');
  });

  it('should render the refund action for succeeded transactions', () => {
    mockUsePaymentTransaction.mockReturnValue({ data: mockTransaction, isLoading: false });
    renderWithProviders(<TransactionDetailPage />, {
      route: '/payments/transactions/txn_4kLm8nPqRs',
    });
    expect(screen.getByRole('button', { name: 'Refund' })).toBeInTheDocument();
  });

  it('should hide the refund action for non-succeeded transactions', () => {
    mockUsePaymentTransaction.mockReturnValue({
      data: { ...mockTransaction, status: 'Failed' },
      isLoading: false,
    });
    renderWithProviders(<TransactionDetailPage />, {
      route: '/payments/transactions/txn_4kLm8nPqRs',
    });
    expect(screen.queryByRole('button', { name: 'Refund' })).not.toBeInTheDocument();
  });

  it('should render the refunds and disputes sections with empty states', () => {
    mockUsePaymentTransaction.mockReturnValue({ data: mockTransaction, isLoading: false });
    renderWithProviders(<TransactionDetailPage />, {
      route: '/payments/transactions/txn_4kLm8nPqRs',
    });
    expect(screen.getByText('Refunds')).toBeInTheDocument();
    expect(screen.getByText('No refunds')).toBeInTheDocument();
    expect(screen.getByText('Disputes')).toBeInTheDocument();
    expect(screen.getByText('No disputes')).toBeInTheDocument();
  });

  it('should render the back link', async () => {
    mockUsePaymentTransaction.mockReturnValue({ data: mockTransaction, isLoading: false });
    renderWithProviders(<TransactionDetailPage />, {
      route: '/payments/transactions/txn_4kLm8nPqRs',
    });
    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });
});
