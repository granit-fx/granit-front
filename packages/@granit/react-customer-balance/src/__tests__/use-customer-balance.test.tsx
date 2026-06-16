import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useAddAdminCredit,
  useApplyAdminDebit,
  useBalanceTransactions,
  useCustomerBalance,
} from '../hooks/use-customer-balance';
import { CustomerBalanceProvider } from '../providers/customer-balance-provider';

import type { CustomerBalanceConfig } from '../providers/customer-balance-provider';
import type {
  AdminCreditRequest,
  AdminDebitRequest,
  BalanceTransactionResponse,
  CustomerBalanceResponse,
} from '@granit/customer-balance';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const sampleBalance: CustomerBalanceResponse = {
  balanceAccountId: 'ba-001',
  currency: 'EUR',
  balance: 150.0,
  concurrencyStamp: 'stamp-1',
  updatedAt: toISODateString('2026-04-01T10:00:00Z'),
};

const sampleTransaction: BalanceTransactionResponse = {
  id: 'tx-001',
  type: 'Credit',
  amount: 50.0,
  source: 'Promotional',
  reason: 'Welcome bonus',
  referenceId: null,
  referenceType: null,
  expiresAt: toISODateString('2026-12-31T23:59:59Z'),
  createdAt: toISODateString('2026-04-01T10:00:00Z'),
};

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: CustomerBalanceConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <CustomerBalanceProvider config={config}>{children}</CustomerBalanceProvider>
    );
  };
}

describe('use-customer-balance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useCustomerBalance', () => {
    it('fetches the current balance with currency param', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleBalance });

      const { result } = renderHook(() => useCustomerBalance('EUR'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/customer-balance/balance', {
        params: { currency: 'EUR' },
      });
      expect(result.current.data).toEqual(sampleBalance);
    });

    it('uses custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleBalance });

      const { result } = renderHook(() => useCustomerBalance('USD'), {
        wrapper: createWrapper(client, '/custom/balance'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/balance/balance', {
        params: { currency: 'USD' },
      });
    });
  });

  describe('useBalanceTransactions', () => {
    it('fetches transactions with all required params', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleTransaction] });

      const { result } = renderHook(
        () => useBalanceTransactions({ currency: 'EUR', page: 1, pageSize: 25 }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/customer-balance/transactions', {
        params: { currency: 'EUR', page: 1, pageSize: 25 },
      });
      expect(result.current.data).toEqual([sampleTransaction]);
    });

    it('returns empty array when no transactions', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      const { result } = renderHook(
        () => useBalanceTransactions({ currency: 'EUR', page: 1, pageSize: 25 }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([]);
    });
  });

  describe('useAddAdminCredit', () => {
    it('posts a credit via POST /balance/credit and returns CustomerBalanceResponse', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleBalance });

      const request: AdminCreditRequest = {
        partyId: 'party-001',
        amount: 50.0,
        currency: 'EUR',
        source: 'Promotional',
        reason: 'Welcome bonus',
        expiresAt: null,
      };

      const { result } = renderHook(() => useAddAdminCredit(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/customer-balance/balance/credit', request);
      expect(result.current.data).toEqual(sampleBalance);
    });

    it('uses custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleBalance });

      const request: AdminCreditRequest = {
        partyId: 'party-001',
        amount: 100.0,
        currency: 'USD',
        source: 'ManualAdjustment',
        reason: 'Compensation',
        expiresAt: toISODateString('2026-12-31T23:59:59Z'),
      };

      const { result } = renderHook(() => useAddAdminCredit(), {
        wrapper: createWrapper(client, '/custom/balance'),
      });

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/custom/balance/balance/credit', request);
    });
  });

  describe('useApplyAdminDebit', () => {
    it('posts a debit via POST /balance/debit and returns CustomerBalanceResponse', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleBalance });

      const request: AdminDebitRequest = {
        partyId: 'party-001',
        amount: 25.0,
        currency: 'EUR',
        reason: 'Manual correction',
      };

      const { result } = renderHook(() => useApplyAdminDebit(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/customer-balance/balance/debit', request);
      expect(result.current.data).toEqual(sampleBalance);
    });

    it('passes optional referenceId and referenceType', async () => {
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

      const { result } = renderHook(() => useApplyAdminDebit(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/customer-balance/balance/debit', request);
    });
  });
});
