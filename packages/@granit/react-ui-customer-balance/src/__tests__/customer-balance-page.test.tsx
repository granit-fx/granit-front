import { toISODateString } from '@granit/types';
import { screen, waitFor } from '@testing-library/react';

import { CustomerBalancePage } from '../customer-balance-page';

import { renderCustomerBalance } from './test-utils';

import type { BalanceTransactionResponse, CustomerBalanceResponse } from '@granit/customer-balance';

const { mockUseCustomerBalance, mockUseBalanceTransactions } = vi.hoisted(() => ({
  mockUseCustomerBalance: vi.fn(),
  mockUseBalanceTransactions: vi.fn(),
}));

vi.mock('@granit/react-customer-balance', () => ({
  useCustomerBalance: () => mockUseCustomerBalance(),
  useBalanceTransactions: () => mockUseBalanceTransactions(),
  useAddAdminCredit: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useApplyAdminDebit: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const mockBalance: CustomerBalanceResponse = {
  balanceAccountId: 'acct-1',
  currency: 'EUR',
  balance: 1250.5,
  concurrencyStamp: 'stamp-1',
  updatedAt: toISODateString('2026-06-01T10:00:00Z'),
};

const mockTransactions: BalanceTransactionResponse[] = [
  {
    id: 'txn-1',
    type: 'Credit',
    amount: 500,
    source: 'Promotional',
    reason: 'Welcome bonus',
    referenceId: null,
    referenceType: null,
    expiresAt: null,
    createdAt: toISODateString('2026-06-01T10:00:00Z'),
  },
  {
    id: 'txn-2',
    type: 'Debit',
    amount: 100,
    source: 'ManualAdjustment',
    reason: 'Correction',
    referenceId: 'ref-99',
    referenceType: 'Order',
    expiresAt: null,
    createdAt: toISODateString('2026-06-02T10:00:00Z'),
  },
];

function setData() {
  mockUseCustomerBalance.mockReturnValue({ data: mockBalance, isLoading: false });
  mockUseBalanceTransactions.mockReturnValue({
    data: { items: mockTransactions, totalCount: 2, hasMore: false },
    isLoading: false,
  });
}

describe('CustomerBalancePage', () => {
  afterEach(() => vi.clearAllMocks());

  it('should show the loading spinner while data is loading', () => {
    mockUseCustomerBalance.mockReturnValue({ data: undefined, isLoading: true });
    mockUseBalanceTransactions.mockReturnValue({ data: undefined, isLoading: true });
    renderCustomerBalance(<CustomerBalancePage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render the page title and subtitle', async () => {
    setData();
    renderCustomerBalance(<CustomerBalancePage />);
    await waitFor(() => {
      expect(screen.getByText('Customer Balance')).toBeInTheDocument();
    });
    expect(screen.getByText('Manage customer balance')).toBeInTheDocument();
  });

  it('should have the page data-slot', async () => {
    setData();
    renderCustomerBalance(<CustomerBalancePage />);
    await waitFor(() => {
      expect(document.querySelector('[data-slot="customer-balance-page"]')).toBeInTheDocument();
    });
  });

  it('should render the credit and debit action buttons', async () => {
    setData();
    renderCustomerBalance(<CustomerBalancePage />);
    await waitFor(() => {
      expect(screen.getByText('Add Credit')).toBeInTheDocument();
    });
    expect(screen.getByText('Apply Debit')).toBeInTheDocument();
  });

  it('should render the balance summary card', async () => {
    setData();
    renderCustomerBalance(<CustomerBalancePage />);
    await waitFor(() => {
      expect(document.querySelector('[data-slot="balance-summary-card"]')).toBeInTheDocument();
    });
    expect(screen.getByText('Current Balance')).toBeInTheDocument();
  });

  it('should render the transaction rows', async () => {
    setData();
    renderCustomerBalance(<CustomerBalancePage />);
    await waitFor(() => {
      expect(screen.getByText('Welcome bonus')).toBeInTheDocument();
    });
    expect(screen.getByText('Correction')).toBeInTheDocument();
  });

  it('should render the empty state when there are no transactions', async () => {
    mockUseCustomerBalance.mockReturnValue({ data: mockBalance, isLoading: false });
    mockUseBalanceTransactions.mockReturnValue({
      data: { items: [], totalCount: 0, hasMore: false },
      isLoading: false,
    });
    renderCustomerBalance(<CustomerBalancePage />);
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });
});
