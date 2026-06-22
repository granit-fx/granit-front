import { screen, waitFor } from '@testing-library/react';

import { PaymentMethodsPage } from '../payment-methods-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Mocks — stub the host configuration data hooks so the page renders
// deterministically without depending on MSW base-URL wiring.
// ---------------------------------------------------------------------------

const { mockUseConfigurations, mockUseProviderCatalog } = vi.hoisted(() => ({
  mockUseConfigurations: vi.fn(),
  mockUseProviderCatalog: vi.fn(),
}));

vi.mock('@granit/react-payments', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePaymentMethodConfigurations: mockUseConfigurations,
    useProviderCatalog: mockUseProviderCatalog,
    useActivatePaymentMethod: () => ({ mutate: vi.fn(), isPending: false }),
    useDeactivatePaymentMethod: () => ({ mutate: vi.fn(), isPending: false }),
    useResyncPaymentMethod: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const sampleProviders = [{ providerName: 'stripe' }];

const sampleCatalog = {
  providerName: 'stripe',
  methods: [
    {
      methodType: 'card',
      displayLabel: 'Card',
      category: 'Card',
      activated: true,
      hasSnapshot: true,
      capability: {
        supportedCountries: [],
        supportedCurrencies: [],
        supportedSequenceTypes: [],
        amountBounds: [],
      },
    },
  ],
};

describe('PaymentMethodsPage', () => {
  beforeEach(() => {
    mockUseConfigurations.mockReturnValue({ data: sampleProviders, isLoading: false });
    mockUseProviderCatalog.mockReturnValue({
      data: sampleCatalog,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('should render the page title and subtitle', () => {
    renderWithProviders(<PaymentMethodsPage />);
    expect(screen.getByText('Payment Methods')).toBeInTheDocument();
    expect(screen.getByText('Manage payment methods')).toBeInTheDocument();
  });

  it('should expose the page data-slot', () => {
    renderWithProviders(<PaymentMethodsPage />);
    expect(document.querySelector('[data-slot="payment-methods-page"]')).toBeInTheDocument();
  });

  it('should render the configuration section with provider cards', () => {
    renderWithProviders(<PaymentMethodsPage />);
    expect(
      document.querySelector('[data-slot="payment-configuration-section"]')
    ).toBeInTheDocument();
    expect(screen.getByText('stripe')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="configuration-row"]')).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
  });

  it('should render the empty state when no providers are installed', () => {
    mockUseConfigurations.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<PaymentMethodsPage />);
    expect(screen.getByText(/No payment providers installed/i)).toBeInTheDocument();
  });

  it('should render the loading spinner while configurations load', () => {
    mockUseConfigurations.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<PaymentMethodsPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should keep title visible after data settles', async () => {
    renderWithProviders(<PaymentMethodsPage />);
    await waitFor(() => {
      expect(screen.getByText('Payment Methods')).toBeInTheDocument();
    });
  });
});
