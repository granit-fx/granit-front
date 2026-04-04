import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useAttachPaymentMethod,
  useAvailablePaymentMethods,
  useCreateCheckoutSession,
  useDetachPaymentMethod,
  useInitiatePaymentCharge,
  usePaymentMethods,
  usePaymentTransaction,
  usePaymentTransactions,
  useRequestPaymentRefund,
} from '../hooks/use-payments.js';
import { PaymentsProvider } from '../providers/payments-provider.js';

import type { PaymentsConfig } from '../providers/payments-provider.js';
import type {
  PaymentAvailableMethodResponse,
  PaymentCheckoutSessionResponse,
  PaymentMethodResponse,
  PaymentRefundResponse,
  PaymentTransactionResponse,
} from '@granit/payments';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleTransaction: PaymentTransactionResponse = {
  id: toEntityId<'PaymentTransaction'>('txn-1'),
  invoiceId: toEntityId<'Invoice'>('inv-1'),
  amount: 5000,
  currency: 'EUR',
  status: 'Succeeded',
  providerName: 'Stripe',
  providerTransactionId: 'pi_abc123',
  paymentMethodId: toEntityId<'PaymentMethod'>('pm-1'),
  actionUrl: null,
  idempotencyKey: 'key-1',
  failureCode: null,
  succeededAt: toISODateString('2026-04-01T10:00:00Z'),
  canceledAt: null,
  refunds: [],
  disputes: [],
  tenantId: null,
};

const sampleRefund: PaymentRefundResponse = {
  id: toEntityId<'PaymentRefund'>('ref-1'),
  amount: 2000,
  currency: 'EUR',
  status: 'Succeeded',
  providerRefundId: 're_abc123',
  reason: 'Customer request',
  createdAt: toISODateString('2026-04-02T10:00:00Z'),
  completedAt: toISODateString('2026-04-02T10:05:00Z'),
};

const sampleCheckoutSession: PaymentCheckoutSessionResponse = {
  url: 'https://checkout.stripe.com/session/abc123',
  sessionId: 'cs_abc123',
  expiresAt: toISODateString('2026-04-01T11:00:00Z'),
};

const sampleMethod: PaymentMethodResponse = {
  id: toEntityId<'PaymentMethod'>('pm-1'),
  type: 'card',
  providerName: 'Stripe',
  providerMethodId: 'pm_abc123',
  displayLabel: 'Visa •••• 4242',
  isDefault: true,
  expiresAt: toISODateString('2028-12-01T00:00:00Z'),
  tenantId: null,
};

const sampleAvailableMethod: PaymentAvailableMethodResponse = {
  methodType: 'card',
  category: 'Card',
  providerName: 'Stripe',
  displayLabel: 'Credit / Debit Card',
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
      expect(client.get).toHaveBeenCalledWith('/api/granit/payments/transactions');
      expect(result.current.data).toEqual([sampleTransaction]);
    });

    it('uses custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => usePaymentTransactions(), {
        wrapper: createWrapper(client, '/custom/payments'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/payments/transactions');
    });
  });

  describe('usePaymentTransaction', () => {
    it('fetches a single transaction', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleTransaction });

      const { result } = renderHook(
        () => usePaymentTransaction(toEntityId<'PaymentTransaction'>('txn-1')),
        {
          wrapper: createWrapper(client),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/granit/payments/transactions/txn-1');
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
        invoiceId: toEntityId<'Invoice'>('inv-1'),
        amount: 5000,
        currency: 'EUR',
        methodType: 'card',
        idempotencyKey: 'key-1',
        providerName: null,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/granit/payments/charge', expect.any(Object));
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockRejectedValue(new Error('Payment failed'));

      const { result } = renderHook(() => useInitiatePaymentCharge(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        invoiceId: toEntityId<'Invoice'>('inv-1'),
        amount: 5000,
        currency: 'EUR',
        methodType: 'card',
        idempotencyKey: 'key-1',
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
        transactionId: toEntityId<'PaymentTransaction'>('txn-1'),
        amount: 2000,
        reason: 'Customer request',
        idempotencyKey: 'key-2',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/granit/payments/refund', expect.any(Object));
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
        transactionId: toEntityId<'PaymentTransaction'>('txn-1'),
        amount: 5000,
        currency: 'EUR',
        methodType: 'card',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        providerName: null,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.url).toBe('https://checkout.stripe.com/session/abc123');
      expect(client.post).toHaveBeenCalledWith('/api/granit/payments/checkout', expect.any(Object));
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
      expect(client.get).toHaveBeenCalledWith('/api/granit/payments/methods');
      expect(result.current.data).toEqual([sampleMethod]);
    });
  });

  describe('useAvailablePaymentMethods', () => {
    it('fetches available payment methods', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleAvailableMethod] });

      const { result } = renderHook(() => useAvailablePaymentMethods(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/granit/payments/methods/available');
      expect(result.current.data).toEqual([sampleAvailableMethod]);
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
      expect(client.post).toHaveBeenCalledWith('/api/granit/payments/methods', expect.any(Object));
    });
  });

  describe('useDetachPaymentMethod', () => {
    it('deletes a payment method by ID', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useDetachPaymentMethod(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(toEntityId<'PaymentMethod'>('pm-1'));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith('/api/granit/payments/methods/pm-1');
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useDetachPaymentMethod(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(toEntityId<'PaymentMethod'>('pm-1'));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Not found');
    });
  });
});
