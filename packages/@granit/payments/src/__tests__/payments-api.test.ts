import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  attachPaymentMethod,
  createCheckoutSession,
  detachPaymentMethod,
  getAvailablePaymentMethods,
  getPaymentTransaction,
  initiatePaymentCharge,
  listPaymentMethods,
  listPaymentTransactions,
  requestPaymentRefund,
} from '../api/payments-api.js';

import type {
  PaymentAttachMethodRequest,
  PaymentAvailableMethodResponse,
  PaymentChargeRequest,
  PaymentCheckoutRequest,
  PaymentCheckoutSessionResponse,
  PaymentMethodResponse,
  PaymentRefundRequest,
  PaymentRefundResponse,
  PaymentTransactionResponse,
} from '../types.js';

const basePath = '/api/granit/payments';

const sampleTransaction: PaymentTransactionResponse = {
  id: 'txn-1',
  invoiceId: 'inv-1',
  amount: 5000,
  currency: 'EUR',
  status: 'Succeeded',
  providerName: 'Stripe',
  providerTransactionId: 'pi_abc123',
  paymentMethodId: 'pm-1',
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
  id: 'ref-1',
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
  id: 'pm-1',
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

describe('payments-api', () => {
  describe('listPaymentTransactions', () => {
    it('should GET {basePath}/transactions', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleTransaction]));

      const result = await listPaymentTransactions(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/transactions`);
      expect(result).toEqual([sampleTransaction]);
    });
  });

  describe('getPaymentTransaction', () => {
    it('should GET {basePath}/transactions/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleTransaction));

      const result = await getPaymentTransaction(client, basePath, 'txn-1');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/transactions/txn-1`);
      expect(result).toEqual(sampleTransaction);
    });

    it('should encode id with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleTransaction));

      await getPaymentTransaction(client, basePath, 'txn/special@id');

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/transactions/${encodeURIComponent('txn/special@id')}`
      );
    });
  });

  describe('initiatePaymentCharge', () => {
    it('should POST {basePath}/charge', async () => {
      const client = createMockClient();
      const request: PaymentChargeRequest = {
        invoiceId: 'inv-1',
        amount: 5000,
        currency: 'EUR',
        methodType: 'card',
        idempotencyKey: 'key-1',
        providerName: null,
      };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleTransaction));

      const result = await initiatePaymentCharge(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/charge`, request);
      expect(result).toEqual(sampleTransaction);
    });
  });

  describe('requestPaymentRefund', () => {
    it('should POST {basePath}/refund', async () => {
      const client = createMockClient();
      const request: PaymentRefundRequest = {
        transactionId: 'txn-1',
        amount: 2000,
        reason: 'Customer request',
        idempotencyKey: 'key-2',
      };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleRefund));

      const result = await requestPaymentRefund(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/refund`, request);
      expect(result).toEqual(sampleRefund);
    });
  });

  describe('createCheckoutSession', () => {
    it('should POST {basePath}/checkout', async () => {
      const client = createMockClient();
      const request: PaymentCheckoutRequest = {
        transactionId: 'txn-1',
        amount: 5000,
        currency: 'EUR',
        methodType: 'card',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        providerName: null,
      };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleCheckoutSession));

      const result = await createCheckoutSession(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/checkout`, request);
      expect(result).toEqual(sampleCheckoutSession);
    });
  });

  describe('listPaymentMethods', () => {
    it('should GET {basePath}/methods', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleMethod]));

      const result = await listPaymentMethods(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/methods`);
      expect(result).toEqual([sampleMethod]);
    });
  });

  describe('getAvailablePaymentMethods', () => {
    it('should GET {basePath}/methods/available', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleAvailableMethod]));

      const result = await getAvailablePaymentMethods(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/methods/available`);
      expect(result).toEqual([sampleAvailableMethod]);
    });
  });

  describe('attachPaymentMethod', () => {
    it('should POST {basePath}/methods', async () => {
      const client = createMockClient();
      const request: PaymentAttachMethodRequest = {
        providerName: 'Stripe',
        type: 'card',
        token: 'tok_abc123',
      };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleMethod));

      const result = await attachPaymentMethod(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/methods`, request);
      expect(result).toEqual(sampleMethod);
    });
  });

  describe('detachPaymentMethod', () => {
    it('should DELETE {basePath}/methods/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await detachPaymentMethod(client, basePath, 'pm-1');

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/methods/pm-1`);
    });

    it('should encode id with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await detachPaymentMethod(client, basePath, 'pm/special@id');

      expect(client.delete).toHaveBeenCalledWith(
        `${basePath}/methods/${encodeURIComponent('pm/special@id')}`
      );
    });
  });
});
