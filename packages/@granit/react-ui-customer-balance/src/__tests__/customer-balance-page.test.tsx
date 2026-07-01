import {
  sampleBalance as mockBalance,
  sampleTransactions as mockTransactions,
} from '@granit/react-customer-balance/testing';
import { screen, waitFor } from '@testing-library/react';

import { CustomerBalancePage } from '../components/customer-balance-page';

import { renderCustomerBalance } from './test-utils';

const { mockUseCustomerBalance, mockUseBalanceTransactions } = vi.hoisted(() => ({
  mockUseCustomerBalance: vi.fn(),
  mockUseBalanceTransactions: vi.fn(),
}));

vi.mock('@granit/react-customer-balance', () => ({
  useCustomerBalance: () => mockUseCustomerBalance(),
  useBalanceTransactions: () => mockUseBalanceTransactions(),
  useAddAdminCredit: () => ({ mutate: vi.fn(), isPending: false }),
  useApplyAdminDebit: () => ({ mutate: vi.fn(), isPending: false }),
}));

function setData() {
  mockUseCustomerBalance.mockReturnValue({ data: mockBalance, isLoading: false });
  mockUseBalanceTransactions.mockReturnValue({
    data: { items: mockTransactions, totalCount: mockTransactions.length, hasMore: false },
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
      expect(screen.getByText('Admin credit - Welcome bonus')).toBeInTheDocument();
    });
    expect(screen.getByText('Invoice INV-2026-001 payment')).toBeInTheDocument();
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
