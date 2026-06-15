import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useArchiveBankAccount,
  useBankAccount,
  useBankAccountsByParty,
  useCreateBankAccount,
  useVerifyBankAccount,
} from '../hooks/use-bank-accounts';
import { BankAccountsProvider } from '../providers/bank-accounts-provider';

import type { BankAccountsConfig } from '../providers/bank-accounts-provider';
import type { BankAccountResponse } from '@granit/bank-accounts';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: BankAccountsConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <BankAccountsProvider config={config}>{children}</BankAccountsProvider>
    );
  };
}

const sampleAccount: BankAccountResponse = {
  id: 'acc-1',
  partyId: 'party-1',
  scheme: 'Iban',
  accountType: 'Checking',
  accountIdentifierMasked: '**** 7034',
  routingCode: null,
  bic: 'GEBABEBB',
  holderName: 'Alice Doe',
  countryCode: 'BE',
  bankName: 'BNP Paribas Fortis',
  bankAddress: null,
  intermediaryBic: null,
  status: 'Active',
  verified: false,
  trusted: false,
  tenantId: null,
};

describe('use-bank-accounts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useBankAccount', () => {
    it('fetches an account by ID with the default basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleAccount });

      const { result } = renderHook(() => useBankAccount('acc-1'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/bank-accounts/acc-1');
      expect(result.current.data).toEqual(sampleAccount);
    });

    it('is disabled when id is empty', () => {
      const client = createMockClient();

      const { result } = renderHook(() => useBankAccount(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useBankAccountsByParty', () => {
    it('fetches the accounts of a party', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleAccount] });

      const { result } = renderHook(() => useBankAccountsByParty('party-1'), {
        wrapper: createWrapper(client, '/custom/bank-accounts'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/bank-accounts/by-party/party-1');
      expect(result.current.data).toEqual([sampleAccount]);
    });

    it('is disabled when partyId is empty', () => {
      const client = createMockClient();

      const { result } = renderHook(() => useBankAccountsByParty(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateBankAccount', () => {
    it('registers an account via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleAccount });

      const { result } = renderHook(() => useCreateBankAccount(), {
        wrapper: createWrapper(client),
      });

      const request = {
        partyId: 'party-1',
        scheme: 'Iban' as const,
        accountIdentifier: 'BE68539007547034',
        holderName: 'Alice Doe',
        countryCode: 'BE',
      };
      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/bank-accounts', request);
    });
  });

  describe('useVerifyBankAccount', () => {
    it('verifies an account via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: { ...sampleAccount, verified: true } });

      const { result } = renderHook(() => useVerifyBankAccount(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('acc-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/bank-accounts/acc-1/verify');
    });
  });

  describe('useArchiveBankAccount', () => {
    it('archives an account via DELETE', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useArchiveBankAccount(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('acc-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith('/api/v1/bank-accounts/acc-1');
    });
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useBankAccount('acc-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});
