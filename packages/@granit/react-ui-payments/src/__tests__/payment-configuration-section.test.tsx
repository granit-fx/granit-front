import { TooltipProvider } from '@granit/react-ui';
import { screen, waitFor } from '@testing-library/react';

import { PaymentConfigurationSection } from '../components/payment-configuration-section';

import { renderWithProviders } from './test-utils';

import type {
  PaymentCatalogMethod,
  PaymentMethodCapabilityResponse,
  PaymentMethodConfigurationItemResponse,
} from '@granit/payments';
import type * as ReactPayments from '@granit/react-payments';

const sampleCapability: PaymentMethodCapabilityResponse = {
  supportedCountries: ['BE'],
  supportedCurrencies: ['EUR'],
  supportedSequenceTypes: ['oneoff'],
  amountBounds: [{ currencyCode: 'EUR', minAmount: 100, maxAmount: 1000000 }],
};

const bancontactActive: PaymentCatalogMethod = {
  methodType: 'bancontact',
  category: 'BankRedirect',
  displayLabel: 'Bancontact',
  capability: sampleCapability,
  activated: true,
  hasSnapshot: true,
};

const idealActiveNoSnapshot: PaymentCatalogMethod = {
  methodType: 'ideal',
  category: 'BankRedirect',
  displayLabel: 'iDEAL',
  capability: sampleCapability,
  activated: true,
  hasSnapshot: false,
};

const epsInactive: PaymentCatalogMethod = {
  methodType: 'eps',
  category: 'BankRedirect',
  displayLabel: 'EPS',
  capability: sampleCapability,
  activated: false,
  hasSnapshot: false,
};

const resyncMutate = vi.fn();
const activateMutate = vi.fn();
const deactivateMutate = vi.fn();
const catalogRefetch = vi.fn();

vi.mock('@granit/react-payments', async () => {
  const actual = await vi.importActual<typeof ReactPayments>('@granit/react-payments');
  return {
    ...actual,
    usePaymentMethodConfigurations: () => ({
      data: [{ providerName: 'mollie', methods: [] }],
      isLoading: false,
      isError: false,
    }),
    useProviderCatalog: (providerName: string) => ({
      data:
        providerName === 'mollie'
          ? {
              providerName: 'mollie',
              methods: [bancontactActive, idealActiveNoSnapshot, epsInactive],
            }
          : undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: catalogRefetch,
    }),
    useActivatePaymentMethod: () => ({ mutate: activateMutate, isPending: false }),
    useDeactivatePaymentMethod: () => ({ mutate: deactivateMutate, isPending: false }),
    useResyncPaymentMethod: () => ({ mutate: resyncMutate, isPending: false }),
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderSection() {
  return renderWithProviders(
    <TooltipProvider>
      <PaymentConfigurationSection />
    </TooltipProvider>
  );
}

describe('PaymentConfigurationSection', () => {
  beforeEach(() => {
    resyncMutate.mockReset();
    activateMutate.mockReset();
    deactivateMutate.mockReset();
    catalogRefetch.mockReset();
  });

  it('renders capability badges on every row — active, no-snapshot, and inactive', () => {
    renderSection();
    const bancontact = document.querySelector('[data-method-type="bancontact"]');
    const ideal = document.querySelector('[data-method-type="ideal"]');
    const eps = document.querySelector('[data-method-type="eps"]');
    expect(bancontact?.querySelector('[data-slot="capability-badges"]')).toBeTruthy();
    expect(ideal?.querySelector('[data-slot="capability-badges"]')).toBeTruthy();
    expect(eps?.querySelector('[data-slot="capability-badges"]')).toBeTruthy();
  });

  it('shows the pending-refresh badge only on active rows without a snapshot', () => {
    renderSection();
    expect(screen.getAllByLabelText('Capability snapshot pending')).toHaveLength(1);
    const ideal = document.querySelector('[data-method-type="ideal"]');
    expect(ideal?.textContent).toContain('Pending refresh');
  });

  it('exposes a per-row Resync button on active rows only', () => {
    renderSection();
    expect(screen.getByLabelText('Resync Bancontact')).toBeInTheDocument();
    expect(screen.getByLabelText('Resync iDEAL')).toBeInTheDocument();
    expect(screen.queryByLabelText('Resync EPS')).not.toBeInTheDocument();
  });

  it('exposes a per-provider Refresh button that triggers a catalog refetch', async () => {
    const { user } = renderSection();
    const refresh = screen.getByLabelText('Refresh mollie catalog');
    expect(refresh).toBeInTheDocument();
    await user.click(refresh);
    expect(catalogRefetch).toHaveBeenCalledTimes(1);
  });

  it('calls useResyncPaymentMethod with providerName + methodType when Resync is clicked', async () => {
    const refreshed: PaymentMethodConfigurationItemResponse = {
      methodType: 'ideal',
      displayLabel: 'iDEAL',
      category: 'BankRedirect',
      activated: true,
      capabilitySnapshot: sampleCapability,
    };
    resyncMutate.mockImplementation(
      (
        _args: unknown,
        options?: { onSuccess?: (data: PaymentMethodConfigurationItemResponse) => void }
      ) => {
        options?.onSuccess?.(refreshed);
      }
    );

    const { user } = renderSection();
    await user.click(screen.getByLabelText('Resync iDEAL'));

    await waitFor(() => {
      expect(resyncMutate).toHaveBeenCalledWith(
        { providerName: 'mollie', methodType: 'ideal' },
        expect.anything()
      );
    });
  });

  it('handles resync errors gracefully without crashing the row', async () => {
    // The component no longer owns error display — API failures are surfaced by
    // the global MutationCache.onError toast, so mutate never throws and the
    // onSuccess callback simply does not fire. The row must survive.
    resyncMutate.mockImplementation(() => {
      /* no onSuccess — simulate a failed mutation */
    });

    const { user } = renderSection();
    await user.click(screen.getByLabelText('Resync iDEAL'));

    await waitFor(() => expect(resyncMutate).toHaveBeenCalled());
    expect(screen.getByLabelText('Resync iDEAL')).toBeInTheDocument();
  });

  it('renders the active count badge for the provider', () => {
    renderSection();
    expect(screen.getByText('2 / 3 active')).toBeInTheDocument();
  });
});
