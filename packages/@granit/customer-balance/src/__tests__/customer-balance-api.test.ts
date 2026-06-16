import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  addAdminCredit,
  applyAdminDebit,
  getCustomerBalance,
  listBalanceTransactions,
} from '../api/customer-balance-api';

import type {
  AdminCreditRequest,
  AdminDebitRequest,
  BalanceTransactionResponse,
  CustomerBalanceResponse,
} from '../types/index';

const sampleBalance: CustomerBalanceResponse = {
  balanceAccountId: 'ba-001',
  currency: 'EUR',
  balance: 150.0,
  concurrencyStamp: 'stamp-1',
  updatedAt: '2026-04-01T10:00:00Z',
};

const sampleTransaction: BalanceTransactionResponse = {
  id: 'tx-001',
  type: 'Credit',
  amount: 50.0,
  source: 'Promotional',
  reason: 'Welcome bonus',
  referenceId: null,
  referenceType: null,
  expiresAt: '2026-12-31T23:59:59Z',
  createdAt: '2026-04-01T10:00:00Z',
};

const basePath = '/customer-balance';

describe('customer-balance-api', () => {
  describe('getCustomerBalance', () => {
    it('should GET {basePath}/balance with currency param', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleBalance });

      const result = await getCustomerBalance(client, basePath, 'EUR');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/balance`, {
        params: { currency: 'EUR' },
      });
      expect(result).toEqual(sampleBalance);
    });

    it('should pass the requested currency to the query param', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: { ...sampleBalance, currency: 'USD' } });

      await getCustomerBalance(client, basePath, 'USD');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/balance`, {
        params: { currency: 'USD' },
      });
    });

    it('should handle null updatedAt', async () => {
      const client = createMockClient();
      const balance: CustomerBalanceResponse = { ...sampleBalance, updatedAt: null };
      vi.mocked(client.get).mockResolvedValue({ data: balance });

      const result = await getCustomerBalance(client, basePath, 'EUR');

      expect(result.updatedAt).toBeNull();
    });
  });

  describe('listBalanceTransactions', () => {
    it('should GET {basePath}/transactions with all required params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleTransaction] });

      const result = await listBalanceTransactions(client, basePath, {
        currency: 'EUR',
        page: 1,
        pageSize: 25,
      });

      expect(client.get).toHaveBeenCalledWith(`${basePath}/transactions`, {
        params: { currency: 'EUR', page: 1, pageSize: 25 },
      });
      expect(result).toEqual([sampleTransaction]);
    });

    it('should pass page and pageSize correctly', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      await listBalanceTransactions(client, basePath, { currency: 'USD', page: 3, pageSize: 10 });

      expect(client.get).toHaveBeenCalledWith(`${basePath}/transactions`, {
        params: { currency: 'USD', page: 3, pageSize: 10 },
      });
    });

    it('should return empty array when no transactions', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const result = await listBalanceTransactions(client, basePath, {
        currency: 'EUR',
        page: 1,
        pageSize: 25,
      });

      expect(result).toEqual([]);
    });
  });

  describe('addAdminCredit', () => {
    it('should POST {basePath}/balance/credit and return CustomerBalanceResponse', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleBalance });

      const request: AdminCreditRequest = {
        partyId: 'party-001',
        amount: 50.0,
        currency: 'EUR',
        source: 'Promotional',
        reason: 'Welcome bonus',
        expiresAt: '2026-12-31T23:59:59Z',
      };

      const result = await addAdminCredit(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/balance/credit`, request);
      expect(result).toEqual(sampleBalance);
    });

    it('should handle ManualAdjustment source', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleBalance });

      const request: AdminCreditRequest = {
        partyId: 'party-001',
        amount: 100.0,
        currency: 'USD',
        source: 'ManualAdjustment',
        reason: 'Compensation',
        expiresAt: null,
      };

      await addAdminCredit(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/balance/credit`, request);
    });
  });

  describe('applyAdminDebit', () => {
    it('should POST {basePath}/balance/debit and return CustomerBalanceResponse', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleBalance });

      const request: AdminDebitRequest = {
        partyId: 'party-001',
        amount: 25.0,
        currency: 'EUR',
        reason: 'Manual correction',
      };

      const result = await applyAdminDebit(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/balance/debit`, request);
      expect(result).toEqual(sampleBalance);
    });

    it('should pass optional referenceId and referenceType', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleBalance });

      const request: AdminDebitRequest = {
        partyId: 'party-001',
        amount: 50.0,
        currency: 'EUR',
        reason: 'Invoice adjustment',
        referenceId: 'ref-uuid-001',
        referenceType: 'AdminAdjustment',
      };

      await applyAdminDebit(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/balance/debit`, request);
    });
  });
});
