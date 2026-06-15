import { DATE_OPERATORS, ENUM_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { noContent, notFound } from '@granit/testing/msw';
import { toEntityId } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { sampleBankAccountEntities, sampleBankAccounts } from './data';

import type { BankAccountResponse, CreateBankAccountRequest } from '@granit/bank-accounts';
import type { QueryMetadata } from '@granit/query-engine';

const SCHEMES = ['Iban', 'UsAch', 'CaEft', 'AuBsb', 'InIfsc', 'Other'];
const STATUSES = ['Active', 'Archived'];
const ACCOUNT_TYPES = ['Unknown', 'Checking', 'Savings'];

/** Mock /meta payload for the bank account admin grid (`GET {basePath}`). */
export const bankAccountQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'partyId',
      label: 'Party',
      type: 'Guid',
      order: 1,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'holderName',
      label: 'Holder',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'scheme',
      label: 'Scheme',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'countryCode',
      label: 'Country',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'accountType',
      label: 'Type',
      type: 'String',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'verified',
      label: 'Verified',
      type: 'Boolean',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'trusted',
      label: 'Trusted',
      type: 'Boolean',
      order: 8,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'tenantId',
      label: 'Tenant',
      type: 'Guid',
      order: 9,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'createdAt',
      label: 'Created at',
      type: 'DateTime',
      order: 10,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'partyId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'holderName', type: 'String', operators: STRING_OPERATORS },
    { name: 'scheme', type: 'String', operators: ENUM_OPERATORS, enumValues: SCHEMES },
    { name: 'countryCode', type: 'String', operators: STRING_OPERATORS },
    {
      name: 'accountType',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: ACCOUNT_TYPES,
    },
    { name: 'status', type: 'String', operators: ENUM_OPERATORS, enumValues: STATUSES },
    { name: 'tenantId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'holderName' },
    { name: 'scheme' },
    { name: 'countryCode' },
    { name: 'accountType' },
    { name: 'status' },
    { name: 'verified' },
    { name: 'trusted' },
    { name: 'createdAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'active', label: 'Active', isDefault: true },
    { name: 'archived', label: 'Archived', isDefault: false },
    { name: 'unverified', label: 'Unverified', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [
    { name: 'scheme', type: 'String' },
    { name: 'status', type: 'String' },
    { name: 'countryCode', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-createdAt',
};

/**
 * Create stateful MSW handlers for bank account endpoints. Create / verify /
 * archive mutations persist in the in-memory list.
 *
 * @param baseUrl - API base path (default: `/api/v1/bank-accounts`)
 */
export function createBankAccountsHandlers(baseUrl = DEFAULT_BASE_PATH) {
  let accounts = [...sampleBankAccounts];

  return [
    // GET {basePath}/meta — QueryEngine metadata (registered before /:id)
    createQueryMetaHandler(baseUrl, bankAccountQueryMetadata),

    // GET {basePath}/by-party/:partyId — active accounts of a party (plain array)
    http.get(`${baseUrl}/by-party/:partyId`, ({ params }) => {
      const partyId = params.partyId as string;
      const owned = accounts.filter((a) => a.partyId === partyId && a.status === 'Active');
      return HttpResponse.json(owned);
    }),

    // GET {basePath} — QueryEngine admin grid (paged)
    http.get(baseUrl, () => {
      return HttpResponse.json({
        items: sampleBankAccountEntities,
        totalCount: sampleBankAccountEntities.length,
      });
    }),

    // POST {basePath} — register a bank account
    http.post(baseUrl, async ({ request }) => {
      const body = (await request.json()) as CreateBankAccountRequest;
      const tail = body.accountIdentifier.slice(-4).padStart(4, '0');
      const newAccount: BankAccountResponse = {
        id: toEntityId<'BankAccount'>(`ba_${String(accounts.length + 1).padStart(3, '0')}`),
        partyId: body.partyId,
        scheme: body.scheme,
        accountType: body.accountType ?? 'Unknown',
        accountIdentifierMasked: `**** ${tail}`,
        routingCode: body.routingCode ?? null,
        bic: body.bic ?? null,
        holderName: body.holderName,
        countryCode: body.countryCode,
        bankName: body.bankName ?? null,
        bankAddress: body.bankAddress ?? null,
        intermediaryBic: body.intermediaryBic ?? null,
        status: 'Active',
        verified: false,
        trusted: body.trusted ?? false,
        tenantId: sampleBankAccounts[0]?.tenantId ?? null,
      };
      accounts = [...accounts, newAccount];
      return HttpResponse.json(newAccount, { status: 201 });
    }),

    // POST {basePath}/:id/verify — mark verified (idempotent)
    http.post(`${baseUrl}/:id/verify`, ({ params }) => {
      const id = params.id as string;
      const existing = accounts.find((a) => a.id === id);
      if (!existing) return notFound();
      const updated: BankAccountResponse = { ...existing, verified: true };
      accounts = accounts.map((a) => (a.id === id ? updated : a));
      return HttpResponse.json(updated);
    }),

    // GET {basePath}/:id — single account
    http.get(`${baseUrl}/:id`, ({ params }) => {
      const account = accounts.find((a) => a.id === params.id);
      if (!account) return notFound();
      return HttpResponse.json(account);
    }),

    // DELETE {basePath}/:id — archive (soft-delete, idempotent)
    http.delete(`${baseUrl}/:id`, ({ params }) => {
      const id = params.id as string;
      const existing = accounts.find((a) => a.id === id);
      if (!existing) return notFound();
      accounts = accounts.map((a) => (a.id === id ? { ...a, status: 'Archived' } : a));
      return noContent();
    }),
  ];
}
