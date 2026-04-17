import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  activatePaymentMethod,
  attachPaymentMethod,
  createCheckoutSession,
  deactivatePaymentMethod,
  detachPaymentMethod,
  getAvailablePaymentMethods,
  getPaymentProviderCatalog,
  getPaymentTransaction,
  initiatePaymentCharge,
  listPaymentMethodConfigurations,
  listPaymentMethods,
  listPaymentTransactions,
  requestPaymentRefund,
  resyncPaymentMethodConfiguration,
} from '../api/payments-api.js';

import type {
  PaymentAttachMethodRequest,
  PaymentAvailableMethodResponse,
  PaymentChargeRequest,
  PaymentCheckoutRequest,
  PaymentCheckoutSessionResponse,
  PaymentMethodCapabilityResponse,
  PaymentMethodConfigurationItem,
  PaymentMethodResponse,
  PaymentProviderCatalogResponse,
  PaymentProviderConfiguration,
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
  succeededAt: '2026-04-01T10:00:00Z',
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
  createdAt: '2026-04-02T10:00:00Z',
  completedAt: '2026-04-02T10:05:00Z',
};

const sampleCheckoutSession: PaymentCheckoutSessionResponse = {
  url: 'https://checkout.stripe.com/session/abc123',
  sessionId: 'cs_abc123',
  expiresAt: '2026-04-01T11:00:00Z',
};

const sampleMethod: PaymentMethodResponse = {
  id: 'pm-1',
  type: 'card',
  providerName: 'Stripe',
  providerMethodId: 'pm_abc123',
  displayLabel: 'Visa •••• 4242',
  isDefault: true,
  expiresAt: '2028-12-01T00:00:00Z',
  tenantId: null,
};

const sampleCapability: PaymentMethodCapabilityResponse = {
  supportedCountries: ['BE', 'NL'],
  supportedCurrencies: ['EUR'],
  supportedSequenceTypes: ['oneoff', 'recurring'],
  amountBounds: [{ currencyCode: 'EUR', minAmount: 1, maxAmount: 1000000 }],
};

const sampleAvailableMethod: PaymentAvailableMethodResponse = {
  methodType: 'card',
  category: 'Card',
  providerName: 'Stripe',
  displayLabel: 'Credit / Debit Card',
  capability: sampleCapability,
};

const sampleConfigurationItem: PaymentMethodConfigurationItem = {
  methodType: 'bancontact',
  displayLabel: 'Bancontact',
  category: 1,
  isActive: true,
  capabilitySnapshot: sampleCapability,
};

const sampleProviderCatalog: PaymentProviderCatalogResponse = {
  providerName: 'mollie',
  methods: [
    {
      methodType: 'bancontact',
      category: 1,
      displayLabel: 'Bancontact',
      capability: sampleCapability,
      isActive: true,
      hasSnapshot: true,
    },
    {
      methodType: 'ideal',
      category: 1,
      displayLabel: 'iDEAL',
      capability: {
        supportedCountries: ['NL'],
        supportedCurrencies: ['EUR'],
        supportedSequenceTypes: ['oneoff'],
        amountBounds: [],
      },
      isActive: false,
      hasSnapshot: false,
    },
  ],
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
    it('should GET {basePath}/methods/available without params when no context', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleAvailableMethod]));

      const result = await getAvailablePaymentMethods(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/methods/available`, undefined);
      expect(result).toEqual([sampleAvailableMethod]);
    });

    it('should send only defined context axes as query params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleAvailableMethod]));

      await getAvailablePaymentMethods(client, basePath, {
        country: 'BE',
        currency: 'EUR',
      });

      expect(client.get).toHaveBeenCalledWith(`${basePath}/methods/available`, {
        params: { country: 'BE', currency: 'EUR' },
      });
    });

    it('should serialize amount as number and sequenceType as-is', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

      await getAvailablePaymentMethods(client, basePath, {
        amount: 4999,
        sequenceType: 'recurring',
      });

      expect(client.get).toHaveBeenCalledWith(`${basePath}/methods/available`, {
        params: { amount: 4999, sequenceType: 'recurring' },
      });
    });

    it('should not send params when context object is empty', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

      await getAvailablePaymentMethods(client, basePath, {});

      expect(client.get).toHaveBeenCalledWith(`${basePath}/methods/available`, undefined);
    });
  });

  describe('getPaymentProviderCatalog', () => {
    it('should GET {basePath}/configuration/catalog with providerName param', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleProviderCatalog));

      const result = await getPaymentProviderCatalog(client, basePath, 'mollie');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/configuration/catalog`, {
        params: { providerName: 'mollie' },
      });
      expect(result).toEqual(sampleProviderCatalog);
      expect(result.methods[0]?.hasSnapshot).toBe(true);
      expect(result.methods[1]?.isActive).toBe(false);
    });
  });

  describe('listPaymentMethodConfigurations', () => {
    it('should GET {basePath}/configuration', async () => {
      const client = createMockClient();
      const payload: readonly PaymentProviderConfiguration[] = [
        { providerName: 'mollie', methods: [sampleConfigurationItem] },
      ];
      vi.mocked(client.get).mockResolvedValue(axiosResponse(payload));

      const result = await listPaymentMethodConfigurations(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/configuration`);
      expect(result).toEqual(payload);
    });
  });

  describe('activatePaymentMethod', () => {
    it('should POST {basePath}/configuration/{provider}/{method}/activate', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleConfigurationItem));

      const result = await activatePaymentMethod(client, basePath, 'mollie', 'bancontact');

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/configuration/mollie/bancontact/activate`
      );
      expect(result).toEqual(sampleConfigurationItem);
    });

    it('should encode providerName and methodType with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleConfigurationItem));

      await activatePaymentMethod(client, basePath, 'sepa/provider', 'bank debit');

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/configuration/${encodeURIComponent('sepa/provider')}/${encodeURIComponent('bank debit')}/activate`
      );
    });
  });

  describe('deactivatePaymentMethod', () => {
    it('should POST {basePath}/configuration/{provider}/{method}/deactivate', async () => {
      const client = createMockClient();
      const deactivated: PaymentMethodConfigurationItem = {
        ...sampleConfigurationItem,
        isActive: false,
      };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(deactivated));

      const result = await deactivatePaymentMethod(client, basePath, 'mollie', 'bancontact');

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/configuration/mollie/bancontact/deactivate`
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('resyncPaymentMethodConfiguration', () => {
    it('should POST {basePath}/configuration/{provider}/{method}/resync with no body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleConfigurationItem));

      const result = await resyncPaymentMethodConfiguration(
        client,
        basePath,
        'mollie',
        'bancontact'
      );

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/configuration/mollie/bancontact/resync`
      );
      expect(vi.mocked(client.post).mock.calls[0]?.length).toBe(1);
      expect(result).toEqual(sampleConfigurationItem);
    });

    it('should encode providerName and methodType with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleConfigurationItem));

      await resyncPaymentMethodConfiguration(client, basePath, 'sepa/provider', 'bank debit');

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/configuration/${encodeURIComponent('sepa/provider')}/${encodeURIComponent('bank debit')}/resync`
      );
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
