import { toEntityId, toISODateString } from '@granit/types';

import type { BankAccount, BankAccountResponse } from '@granit/bank-accounts';
import type { Mutable } from '@granit/testing';
import type { TenantId } from '@granit/types';

const TENANT_ID = toEntityId<'Tenant'>('tnt_001') as unknown as TenantId;
const PARTY_ID = toEntityId<'Party'>('pty_001');

export const sampleBankAccounts: Mutable<BankAccountResponse>[] = [
  {
    id: toEntityId<'BankAccount'>('ba_001'),
    partyId: PARTY_ID,
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
    verified: true,
    trusted: true,
    tenantId: TENANT_ID,
  },
  {
    id: toEntityId<'BankAccount'>('ba_002'),
    partyId: PARTY_ID,
    scheme: 'UsAch',
    accountType: 'Savings',
    accountIdentifierMasked: '**** 6789',
    routingCode: '021000021',
    bic: null,
    holderName: 'Alice Doe',
    countryCode: 'US',
    bankName: 'JPMorgan Chase',
    bankAddress: null,
    intermediaryBic: null,
    status: 'Active',
    verified: false,
    trusted: false,
    tenantId: TENANT_ID,
  },
];

/** QueryEngine entity rows for the bank account admin grid (`GET {basePath}`). */
export const sampleBankAccountEntities: Mutable<BankAccount>[] = sampleBankAccounts.map((a) => ({
  id: a.id,
  tenantId: TENANT_ID,
  partyId: a.partyId,
  scheme: a.scheme,
  // The encrypted account identifier is excluded from the query projection.
  accountIdentifier: '',
  routingCode: a.routingCode,
  bic: a.bic,
  holderName: a.holderName,
  countryCode: a.countryCode,
  accountType: a.accountType,
  bankName: a.bankName,
  bankAddress: a.bankAddress,
  intermediaryBic: a.intermediaryBic,
  internalNote: null,
  status: a.status,
  verified: a.verified,
  trusted: a.trusted,
  createdAt: toISODateString('2026-04-01T00:00:00Z'),
  createdBy: 'usr_seed',
  modifiedAt: null,
  modifiedBy: null,
}));
