import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  archiveBankAccount,
  createBankAccount,
  getBankAccount,
  getBankAccountsQueryMeta,
  listBankAccounts,
  listBankAccountsByParty,
  verifyBankAccount,
} from '../api/bank-accounts-api';

import type { BankAccount, BankAccountResponse, CreateBankAccountRequest } from '../types/index';
import type { QueryMetadata } from '@granit/query-engine';
import type { ISODateString, TenantId } from '@granit/types';

const basePath = '/bank-accounts';

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
  tenantId: 'tenant-1' as TenantId,
};

describe('bank-accounts-api', () => {
  describe('createBankAccount', () => {
    it('should POST {basePath} with the request body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleAccount });

      const request: CreateBankAccountRequest = {
        partyId: 'party-1',
        scheme: 'Iban',
        accountIdentifier: 'BE68539007547034',
        holderName: 'Alice Doe',
        countryCode: 'BE',
      };

      const result = await createBankAccount(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/bank-accounts', request);
      expect(result).toEqual(sampleAccount);
    });
  });

  describe('getBankAccount', () => {
    it('should GET {basePath}/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleAccount });

      const result = await getBankAccount(client, basePath, 'acc-1');

      expect(client.get).toHaveBeenCalledWith('/bank-accounts/acc-1');
      expect(result).toEqual(sampleAccount);
    });

    it('should encode the id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleAccount });

      await getBankAccount(client, basePath, 'acc/special');

      expect(client.get).toHaveBeenCalledWith('/bank-accounts/acc%2Fspecial');
    });
  });

  describe('listBankAccountsByParty', () => {
    it('should GET {basePath}/by-party/{partyId} and return the array', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleAccount] });

      const result = await listBankAccountsByParty(client, basePath, 'party-1');

      expect(client.get).toHaveBeenCalledWith('/bank-accounts/by-party/party-1');
      expect(result).toEqual([sampleAccount]);
    });

    it('should encode the partyId', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      await listBankAccountsByParty(client, basePath, 'party/special');

      expect(client.get).toHaveBeenCalledWith('/bank-accounts/by-party/party%2Fspecial');
    });
  });

  describe('verifyBankAccount', () => {
    it('should POST {basePath}/{id}/verify', async () => {
      const client = createMockClient();
      const verified = { ...sampleAccount, verified: true };
      vi.mocked(client.post).mockResolvedValue({ data: verified });

      const result = await verifyBankAccount(client, basePath, 'acc-1');

      expect(client.post).toHaveBeenCalledWith('/bank-accounts/acc-1/verify');
      expect(result).toEqual(verified);
    });

    it('should encode the id', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleAccount });

      await verifyBankAccount(client, basePath, 'acc/special');

      expect(client.post).toHaveBeenCalledWith('/bank-accounts/acc%2Fspecial/verify');
    });
  });

  describe('archiveBankAccount', () => {
    it('should DELETE {basePath}/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      await archiveBankAccount(client, basePath, 'acc-1');

      expect(client.delete).toHaveBeenCalledWith('/bank-accounts/acc-1');
    });

    it('should encode the id', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      await archiveBankAccount(client, basePath, 'acc/special');

      expect(client.delete).toHaveBeenCalledWith('/bank-accounts/acc%2Fspecial');
    });
  });

  it('should work with a custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleAccount] });

    await listBankAccountsByParty(client, '/custom/bank-accounts', 'party-1');

    expect(client.get).toHaveBeenCalledWith('/custom/bank-accounts/by-party/party-1');
  });
});

// ---------------------------------------------------------------------------
// QueryEngine wrappers
// ---------------------------------------------------------------------------

const sampleEntity: BankAccount = {
  id: 'acc-1',
  tenantId: 'tenant-1' as TenantId,
  partyId: 'party-1',
  scheme: 'Iban',
  accountIdentifier: '',
  routingCode: null,
  bic: 'GEBABEBB',
  holderName: 'Alice Doe',
  countryCode: 'BE',
  accountType: 'Checking',
  bankName: 'BNP Paribas Fortis',
  bankAddress: null,
  intermediaryBic: null,
  internalNote: null,
  status: 'Active',
  verified: true,
  trusted: false,
  createdAt: '2026-04-01T00:00:00Z' as ISODateString,
  createdBy: 'user-1',
  modifiedAt: null,
  modifiedBy: null,
};

const sampleMeta: QueryMetadata = {
  columns: [],
  filterableFields: [],
} as unknown as QueryMetadata;

describe('bank-accounts-api / QueryEngine', () => {
  describe('listBankAccounts', () => {
    it('should GET {basePath} with serialized params', async () => {
      const client = createMockClient();
      const page = { items: [sampleEntity], totalCount: 1 };
      vi.mocked(client.get).mockResolvedValue({ data: page });

      const result = await listBankAccounts(client, basePath, { page: 1, pageSize: 25 });

      expect(client.get).toHaveBeenCalledTimes(1);
      const url = vi.mocked(client.get).mock.calls[0]?.[0] as string;
      expect(url).toContain('/bank-accounts');
      expect(url).toContain('page=1');
      expect(url).toContain('pageSize=25');
      expect(result).toEqual(page);
    });

    it('should GET {basePath} with no query string when params omitted', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: { items: [], totalCount: 0 } });

      await listBankAccounts(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/bank-accounts', undefined);
    });
  });

  describe('getBankAccountsQueryMeta', () => {
    it('should GET {basePath}/meta', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleMeta });

      const result = await getBankAccountsQueryMeta(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/bank-accounts/meta', undefined);
      expect(result).toEqual(sampleMeta);
    });
  });
});
