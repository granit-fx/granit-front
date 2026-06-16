import { toEntityId, toISODateString } from '@granit/types';

import type { BalanceTransactionResponse, CustomerBalanceResponse } from '@granit/customer-balance';
import type { Mutable } from '@granit/testing';

export const sampleBalance: Mutable<CustomerBalanceResponse> = {
  balanceAccountId: toEntityId<'BalanceAccount'>('ba_01'),
  currency: 'EUR',
  balance: 15000,
  concurrencyStamp: 'stamp-1',
  updatedAt: toISODateString('2026-04-04T08:30:00Z'),
};

export const sampleTransactions: Mutable<BalanceTransactionResponse>[] = [
  {
    id: toEntityId<'BalanceTransaction'>('txn_001'),
    type: 'Credit',
    amount: 10000,
    source: 'Promotional',
    reason: 'Admin credit - Welcome bonus',
    referenceId: 'ADM-2026-001',
    referenceType: 'AdminCredit',
    expiresAt: null,
    createdAt: toISODateString('2026-04-01T10:00:00Z'),
  },
  {
    id: toEntityId<'BalanceTransaction'>('txn_002'),
    type: 'Debit',
    amount: -500,
    source: 'Invoice',
    reason: 'Invoice INV-2026-001 payment',
    referenceId: 'INV-2026-001',
    referenceType: 'Invoice',
    expiresAt: null,
    createdAt: toISODateString('2026-04-02T14:30:00Z'),
  },
  {
    id: toEntityId<'BalanceTransaction'>('txn_003'),
    type: 'Credit',
    amount: 5500,
    source: 'ManualAdjustment',
    reason: 'Admin credit - Service compensation',
    referenceId: 'ADM-2026-002',
    referenceType: 'AdminCredit',
    expiresAt: null,
    createdAt: toISODateString('2026-04-03T09:15:00Z'),
  },
  {
    id: toEntityId<'BalanceTransaction'>('txn_004'),
    type: 'Debit',
    amount: -500,
    source: 'Metering',
    reason: 'Metering usage charge',
    referenceId: 'MTR-2026-001',
    referenceType: 'Metering',
    expiresAt: null,
    createdAt: toISODateString('2026-04-04T08:30:00Z'),
  },
];
