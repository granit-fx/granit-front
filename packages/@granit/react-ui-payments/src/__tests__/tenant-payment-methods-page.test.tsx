import { samplePaymentMethods } from '@granit/react-payments/testing';
import { screen, waitFor } from '@testing-library/react';

import { TenantPaymentMethodsPage } from '../components/tenant-payment-methods-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Mocks — stub the saved-methods query hook so the page renders both the
// populated and empty-state branches deterministically.
// ---------------------------------------------------------------------------

const { mockUsePaymentMethods } = vi.hoisted(() => ({
  mockUsePaymentMethods: vi.fn(),
}));

vi.mock('@granit/react-payments', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePaymentMethods: mockUsePaymentMethods,
    useAvailablePaymentMethods: () => ({ data: [], isLoading: false }),
    useAttachPaymentMethod: () => ({ mutate: vi.fn(), isPending: false }),
    useDetachPaymentMethod: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const sampleMethods = samplePaymentMethods;

describe('TenantPaymentMethodsPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('should render the page title, subtitle and data-slot', () => {
    mockUsePaymentMethods.mockReturnValue({ data: sampleMethods, isLoading: false });
    renderWithProviders(<TenantPaymentMethodsPage />);
    expect(screen.getByText('My payment methods')).toBeInTheDocument();
    expect(screen.getByText('Manage your saved payment methods')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="tenant-payment-methods-page"]')).toBeInTheDocument();
  });

  it('should render the add button', () => {
    mockUsePaymentMethods.mockReturnValue({ data: sampleMethods, isLoading: false });
    renderWithProviders(<TenantPaymentMethodsPage />);
    expect(screen.getByText('Add payment method')).toBeInTheDocument();
  });

  it('should render a card per saved method', () => {
    mockUsePaymentMethods.mockReturnValue({ data: sampleMethods, isLoading: false });
    renderWithProviders(<TenantPaymentMethodsPage />);
    const cards = document.querySelectorAll('[data-slot="payment-method-card"]');
    expect(cards).toHaveLength(3);
    expect(screen.getByText('Visa ending in 4242')).toBeInTheDocument();
    expect(screen.getByText('Mastercard ending in 5555')).toBeInTheDocument();
    expect(screen.getByText('SEPA ending in 6789')).toBeInTheDocument();
  });

  it('should render the empty state when there are no methods', () => {
    mockUsePaymentMethods.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<TenantPaymentMethodsPage />);
    expect(screen.getByText('No payment methods yet.')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="payment-method-card"]')).not.toBeInTheDocument();
  });

  it('should render the loading spinner while methods load', () => {
    mockUsePaymentMethods.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<TenantPaymentMethodsPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should keep the title visible after data settles', async () => {
    mockUsePaymentMethods.mockReturnValue({ data: sampleMethods, isLoading: false });
    renderWithProviders(<TenantPaymentMethodsPage />);
    await waitFor(() => {
      expect(screen.getByText('My payment methods')).toBeInTheDocument();
    });
  });
});
