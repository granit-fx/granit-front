import { toISODateString } from '@granit/types';
import { screen, waitFor } from '@testing-library/react';

import { TransactionListPage } from '../transaction-list-page';

import { renderWithProviders } from './test-utils';

import type { PaymentTransactionResponse } from '@granit/payments';

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

const sampleTransactions: PaymentTransactionResponse[] = [
  {
    id: 'txn_4kLm8nPqRs',
    invoiceId: 'inv_001',
    amount: 24900,
    currency: 'EUR',
    status: 'Succeeded',
    providerName: 'Stripe',
    providerTransactionId: 'pi_stripe_001',
    paymentMethodId: 'pm_visa_4242',
    actionUrl: null,
    idempotencyKey: 'idem_001',
    failureCode: null,
    succeededAt: toISODateString('2026-03-28T14:22:00Z'),
    canceledAt: null,
    refunds: [],
    disputes: [],
    tenantId: 'tenant_01',
  },
  {
    id: 'txn_2gHiJkLmNo',
    invoiceId: 'inv_003',
    amount: 12000,
    currency: 'USD',
    status: 'Failed',
    providerName: 'Stripe',
    providerTransactionId: 'pi_stripe_003',
    paymentMethodId: 'pm_visa_1234',
    actionUrl: null,
    idempotencyKey: 'idem_003',
    failureCode: 'card_declined',
    succeededAt: null,
    canceledAt: null,
    refunds: [],
    disputes: [],
    tenantId: 'tenant_01',
  },
];

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
