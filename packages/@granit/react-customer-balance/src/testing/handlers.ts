import {
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  STRING_OPERATORS,
} from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { created } from '@granit/testing/msw';
import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { sampleBalance, sampleTransactions } from './data';

import type { AdminCreditRequest, AdminDebitRequest } from '@granit/customer-balance';
import type { QueryMetadata } from '@granit/query-engine';

/** Mock /meta payload for the customer balance transactions resource. */
export const balanceTransactionQueryMetadata: QueryMetadata = {
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
      name: 'createdAt',
      label: 'Date',
      type: 'DateTime',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'type',
      label: 'Type',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'amount',
      label: 'Amount',
      type: 'Decimal',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'source',
      label: 'Source',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'reason',
      label: 'Reason',
      type: 'String',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'referenceType',
      label: 'Reference type',
      type: 'String',
      order: 6,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'referenceId',
      label: 'Reference ID',
      type: 'String',
      order: 7,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'expiresAt',
      label: 'Expires at',
      type: 'DateTime',
      order: 8,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'type', type: 'String', operators: ENUM_OPERATORS },
    { name: 'amount', type: 'Decimal', operators: NUMBER_OPERATORS },
    { name: 'source', type: 'String', operators: ENUM_OPERATORS },
    { name: 'reason', type: 'String', operators: STRING_OPERATORS },
    { name: 'referenceType', type: 'String', operators: ENUM_OPERATORS },
    { name: 'expiresAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'createdAt' },
    { name: 'type' },
    { name: 'amount' },
    { name: 'source' },
    { name: 'expiresAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'credits', label: 'Credits', isDefault: false },
    { name: 'debits', label: 'Debits', isDefault: false },
  ],
  dateFilters: [
    {
      name: 'createdAt',
      defaultPeriod: 'ThisMonth',
      availablePeriods: [
        'Today',
        'ThisWeek',
        'ThisMonth',
        'LastMonth',
        'ThisQuarter',
        'ThisYear',
        'Custom',
      ],
    },
  ],
  groupByFields: [
    { name: 'type', type: 'String' },
    { name: 'source', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 50_000,
    supportsCursor: false,
  },
  defaultSort: '-createdAt',
};

/**
 * Create stateful MSW handlers for customer balance endpoints.
 * Credit/debit mutations update the in-memory balance amount.
 *
 * @param baseUrl - API base path (default: `/api/v1/customer-balance`)
 */
export function createCustomerBalanceHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET /transactions/meta — query metadata
    createQueryMetaHandler(`${baseUrl}/transactions`, balanceTransactionQueryMetadata),

    // GET current balance
    http.get(`${baseUrl}/balance`, () => {
      return HttpResponse.json(sampleBalance);
    }),

    // GET transaction history
    http.get(`${baseUrl}/transactions`, () => {
      return HttpResponse.json({
        items: sampleTransactions,
        totalCount: sampleTransactions.length,
      });
    }),

    // POST admin credit
    http.post(`${baseUrl}/balance/credit`, async ({ request }) => {
      const body = (await request.json()) as AdminCreditRequest;
      sampleBalance.balance = sampleBalance.balance + body.amount;
      sampleBalance.updatedAt = toISODateString(new Date().toISOString());
      return created({ ...sampleBalance });
    }),

    // POST admin debit
    http.post(`${baseUrl}/balance/debit`, async ({ request }) => {
      const body = (await request.json()) as AdminDebitRequest;
      sampleBalance.balance = sampleBalance.balance - body.amount;
      sampleBalance.updatedAt = toISODateString(new Date().toISOString());
      return HttpResponse.json({ ...sampleBalance });
    }),
  ];
}
