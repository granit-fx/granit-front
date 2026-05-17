import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  addAdminCredit,
  getCustomerBalance,
  listBalanceTransactions,
} from '../api/customer-balance-api.js';

import type {
  AdminCreditRequest,
  BalanceTransactionResponse,
  CustomerBalanceResponse,
} from '../types/index.js';

const sampleBalance: CustomerBalanceResponse = {
  balanceAccountId: 'ba-001',
  currency: 'EUR',
  balance: 150.0,
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
    it('should GET {basePath}/balance', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleBalance });

      const result = await getCustomerBalance(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/balance`);
      expect(result).toEqual(sampleBalance);
    });

    it('should work with custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleBalance });

      await getCustomerBalance(client, '/api/v2/balance');

      expect(client.get).toHaveBeenCalledWith('/api/v2/balance/balance');
    });

    it('should handle null updatedAt', async () => {
      const client = createMockClient();
      const balance: CustomerBalanceResponse = { ...sampleBalance, updatedAt: null };
      vi.mocked(client.get).mockResolvedValue({ data: balance });

      const result = await getCustomerBalance(client, basePath);

      expect(result.updatedAt).toBeNull();
    });
  });

  describe('listBalanceTransactions', () => {
    it('should GET {basePath}/transactions', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleTransaction] });

      const result = await listBalanceTransactions(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/transactions`);
      expect(result).toEqual([sampleTransaction]);
    });

    it('should return empty array when no transactions', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const result = await listBalanceTransactions(client, basePath);

      expect(result).toEqual([]);
    });
  });

  describe('addAdminCredit', () => {
    it('should POST {basePath}/credit', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const request: AdminCreditRequest = {
        amount: 50.0,
        currency: 'EUR',
        source: 'Promotional',
        reason: 'Welcome bonus',
        expiresAt: '2026-12-31T23:59:59Z',
      };

      await addAdminCredit(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/credit`, request);
    });

    it('should handle ManualAdjustment source', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const request: AdminCreditRequest = {
        amount: 100.0,
        currency: 'USD',
        source: 'ManualAdjustment',
        reason: 'Compensation',
        expiresAt: null,
      };

      await addAdminCredit(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/credit`, request);
    });
  });
});
