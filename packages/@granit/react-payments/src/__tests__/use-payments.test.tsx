import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  sampleAvailableMethods,
  samplePaymentMethods,
  sampleRefunds,
  sampleTransactions,
} from '@granit/react-payments/testing';

import {
  useActivatePaymentMethod,
  useAttachPaymentMethod,
  useAvailablePaymentMethods,
  useCreateCheckoutSession,
  useDeactivatePaymentMethod,
  useDetachPaymentMethod,
  useInitiatePaymentCharge,
  usePaymentMethodConfigurations,
  usePaymentMethods,
  usePaymentTransaction,
  usePaymentTransactions,
  useProviderCatalog,
  useRequestPaymentRefund,
  useResyncPaymentMethod,
} from '../hooks/use-payments';
import { PaymentsProvider } from '../providers/payments-provider';

import type { PaymentsConfig } from '../providers/payments-provider';
import type {
  PaymentCheckoutSessionResponse,
  PaymentMethodCapabilityResponse,
  PaymentMethodConfigurationItemResponse,
  PaymentProviderCatalogResponse,
  PaymentProviderConfigurationResponse,
} from '@granit/payments';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleTransaction = sampleTransactions[0]!;

const sampleRefund = sampleRefunds[0]!;

const sampleCheckoutSession: PaymentCheckoutSessionResponse = {
  url: 'https://checkout.stripe.com/session/abc123',
  sessionId: 'cs_abc123',
  expiresAt: toISODateString('2026-04-01T11:00:00Z'),
};

const sampleMethod = samplePaymentMethods[0]!;

const sampleCapability: PaymentMethodCapabilityResponse = {
  supportedCountries: ['BE'],
  supportedCurrencies: ['EUR'],
  supportedSequenceTypes: ['oneoff'],
  amountBounds: [{ currencyCode: 'EUR', minAmount: 1, maxAmount: 1000000 }],
};

const sampleAvailableMethod = sampleAvailableMethods[0]!;

const sampleConfigurationItem: PaymentMethodConfigurationItemResponse = {
  methodType: 'bancontact',
  displayLabel: 'Bancontact',
  category: 'BankRedirect',
  activated: true,
  capabilitySnapshot: sampleCapability,
};

const sampleProviderCatalog: PaymentProviderCatalogResponse = {
  providerName: 'mollie',
  methods: [
    {
      methodType: 'bancontact',
      category: 'BankRedirect',
      displayLabel: 'Bancontact',
      capability: sampleCapability,
      activated: true,
      hasSnapshot: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: PaymentsConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <PaymentsProvider config={config}>{children}</PaymentsProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('use-payments', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usePaymentTransactions', () => {
    it('fetches transactions', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleTransaction] });

      const { result } = renderHook(() => usePaymentTransactions(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/payments/transactions/mine');
      expect(result.current.data).toEqual([sampleTransaction]);
    });

    it('uses custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => usePaymentTransactions(), {
        wrapper: createWrapper(client, '/custom/payments'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/payments/transactions/mine');
    });
  });

  describe('usePaymentTransaction', () => {
    it('fetches a single transaction', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleTransaction });

      const { result } = renderHook(() => usePaymentTransaction('txn-1'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/payments/transactions/txn-1');
      expect(result.current.data).toEqual(sampleTransaction);
    });

    it('is disabled when id is empty', () => {
      const client = createMockClient();

      const { result } = renderHook(() => usePaymentTransaction(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useInitiatePaymentCharge', () => {
    it('posts a charge and returns transaction', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleTransaction });

      const { result } = renderHook(() => useInitiatePaymentCharge(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        invoiceId: 'inv-1',
        amount: 5000,
        currency: 'EUR',
        methodType: 'card',
        providerName: null,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/payments/charge', expect.any(Object));
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockRejectedValue(new Error('Payment failed'));

      const { result } = renderHook(() => useInitiatePaymentCharge(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        invoiceId: 'inv-1',
        amount: 5000,
        currency: 'EUR',
        methodType: 'card',
        providerName: null,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Payment failed');
    });
  });

  describe('useRequestPaymentRefund', () => {
    it('posts a refund request', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleRefund });

      const { result } = renderHook(() => useRequestPaymentRefund(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        transactionId: 'txn-1',
        amount: 2000,
        reason: 'Customer request',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/payments/refund', expect.any(Object));
    });
  });

  describe('useCreateCheckoutSession', () => {
    it('posts a checkout session and returns URL', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleCheckoutSession });

      const { result } = renderHook(() => useCreateCheckoutSession(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        transactionId: 'txn-1',
        amount: 5000,
        currency: 'EUR',
        methodType: 'card',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        providerName: null,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.url).toBe('https://checkout.stripe.com/session/abc123');
      expect(client.post).toHaveBeenCalledWith('/api/v1/payments/checkout', expect.any(Object));
    });
  });

  describe('usePaymentMethods', () => {
    it('fetches payment methods', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleMethod] });

      const { result } = renderHook(() => usePaymentMethods(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/payments/methods/mine');
      expect(result.current.data).toEqual([sampleMethod]);
    });
  });

  describe('useAvailablePaymentMethods', () => {
    it('fetches without context — no query params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleAvailableMethod] });

      const { result } = renderHook(() => useAvailablePaymentMethods(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/payments/methods/available', undefined);
      expect(result.current.data).toEqual([sampleAvailableMethod]);
    });

    it('forwards context axes as params and keys distinct contexts separately', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleAvailableMethod] });

      const { result: beResult } = renderHook(
        () => useAvailablePaymentMethods({ country: 'BE', currency: 'EUR' }),
        { wrapper: createWrapper(client) }
      );
      await waitFor(() => expect(beResult.current.isSuccess).toBe(true));

      expect(client.get).toHaveBeenCalledWith('/api/v1/payments/methods/available', {
        params: { country: 'BE', currency: 'EUR' },
      });

      // A distinct context should trigger a separate fetch (different query key).
      vi.mocked(client.get).mockClear();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const { result: nlResult } = renderHook(
        () => useAvailablePaymentMethods({ country: 'NL', currency: 'EUR' }),
        { wrapper: createWrapper(client) }
      );
      await waitFor(() => expect(nlResult.current.isSuccess).toBe(true));

      expect(client.get).toHaveBeenCalledWith('/api/v1/payments/methods/available', {
        params: { country: 'NL', currency: 'EUR' },
      });
    });
  });

  describe('useProviderCatalog', () => {
    it('fetches catalog for the given provider', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleProviderCatalog });

      const { result } = renderHook(() => useProviderCatalog('mollie'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/payments/configuration/catalog', {
        params: { providerName: 'mollie' },
      });
      expect(result.current.data).toEqual(sampleProviderCatalog);
    });

    it('is disabled when providerName is empty', () => {
      const client = createMockClient();

      const { result } = renderHook(() => useProviderCatalog(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('usePaymentMethodConfigurations', () => {
    it('fetches the fused provider configuration list', async () => {
      const client = createMockClient();
      const payload: readonly PaymentProviderConfigurationResponse[] = [
        { providerName: 'mollie', methods: [sampleConfigurationItem] },
      ];
      vi.mocked(client.get).mockResolvedValue({ data: payload });

      const { result } = renderHook(() => usePaymentMethodConfigurations(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/payments/configuration');
      expect(result.current.data).toEqual(payload);
    });
  });

  describe('useActivatePaymentMethod', () => {
    it('posts to the activate endpoint and returns the refreshed config item', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleConfigurationItem });

      const { result } = renderHook(() => useActivatePaymentMethod(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ providerName: 'mollie', methodType: 'bancontact' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/payments/configuration/mollie/bancontact/activate'
      );
      expect(result.current.data).toEqual(sampleConfigurationItem);
    });

    it('surfaces a 400 when the provider no longer offers the method', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockRejectedValue(new Error('Method no longer offered'));

      const { result } = renderHook(() => useActivatePaymentMethod(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ providerName: 'mollie', methodType: 'bancontact' });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Method no longer offered');
    });
  });

  describe('useDeactivatePaymentMethod', () => {
    it('posts to the deactivate endpoint and returns the refreshed config item', async () => {
      const client = createMockClient();
      const deactivated: PaymentMethodConfigurationItemResponse = {
        ...sampleConfigurationItem,
        activated: false,
      };
      vi.mocked(client.post).mockResolvedValue({ data: deactivated });

      const { result } = renderHook(() => useDeactivatePaymentMethod(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ providerName: 'mollie', methodType: 'bancontact' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/payments/configuration/mollie/bancontact/deactivate'
      );
      expect(result.current.data?.activated).toBe(false);
    });
  });

  describe('useResyncPaymentMethod', () => {
    it('posts to the resync endpoint and returns the refreshed config item', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleConfigurationItem });

      const { result } = renderHook(() => useResyncPaymentMethod(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ providerName: 'mollie', methodType: 'bancontact' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/payments/configuration/mollie/bancontact/resync'
      );
      expect(result.current.data).toEqual(sampleConfigurationItem);
    });

    it('surfaces backend 400 / 404 errors', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockRejectedValue(new Error('Method no longer offered'));

      const { result } = renderHook(() => useResyncPaymentMethod(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ providerName: 'mollie', methodType: 'bancontact' });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Method no longer offered');
    });
  });

  describe('useAttachPaymentMethod', () => {
    it('posts to attach a payment method', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleMethod });

      const { result } = renderHook(() => useAttachPaymentMethod(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        providerName: 'Stripe',
        type: 'card',
        token: 'tok_abc123',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/payments/methods', expect.any(Object));
    });
  });

  describe('useDetachPaymentMethod', () => {
    it('deletes a payment method by ID', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useDetachPaymentMethod(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('pm-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith('/api/v1/payments/methods/pm-1');
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useDetachPaymentMethod(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('pm-1');

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Not found');
    });
  });
});
