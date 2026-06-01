import {
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  STRING_OPERATORS,
} from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { noContent, notFound } from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  sampleAvailableMethods,
  sampleDisputes,
  samplePaymentMethods,
  sampleRefunds,
  sampleTransactions,
} from './data';

import type {
  PaymentAttachMethodRequest,
  PaymentChargeRequest,
  PaymentCheckoutRequest,
  PaymentRefundRequest,
} from '@granit/payments';
import type { QueryMetadata } from '@granit/query-engine';
import type { CurrencyCode } from '@granit/types';

const PAYMENT_STATUSES = [
  'Pending',
  'Processing',
  'Succeeded',
  'Failed',
  'Canceled',
  'RequiresAction',
];

/** Mock /meta payload for the payment transactions resource. */
export const paymentTransactionQueryMetadata: QueryMetadata = {
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
      name: 'invoiceId',
      label: 'Invoice',
      type: 'Guid',
      order: 1,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'amount',
      label: 'Amount',
      type: 'Decimal',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'currency',
      label: 'Currency',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'providerName',
      label: 'Provider',
      type: 'String',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'providerTransactionId',
      label: 'Provider txn',
      type: 'String',
      order: 6,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'succeededAt',
      label: 'Succeeded at',
      type: 'DateTime',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'canceledAt',
      label: 'Canceled at',
      type: 'DateTime',
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
  ],
  filterableFields: [
    { name: 'invoiceId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'amount', type: 'Decimal', operators: NUMBER_OPERATORS },
    { name: 'currency', type: 'String', operators: ENUM_OPERATORS },
    { name: 'status', type: 'String', operators: ENUM_OPERATORS, enumValues: PAYMENT_STATUSES },
    { name: 'providerName', type: 'String', operators: STRING_OPERATORS },
    { name: 'providerTransactionId', type: 'String', operators: STRING_OPERATORS },
    { name: 'failureCode', type: 'String', operators: STRING_OPERATORS },
    { name: 'succeededAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'canceledAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'tenantId', type: 'Guid', operators: ENUM_OPERATORS },
  ],
  sortableFields: [
    { name: 'amount' },
    { name: 'currency' },
    { name: 'status' },
    { name: 'providerName' },
    { name: 'succeededAt' },
    { name: 'canceledAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'succeeded', label: 'Succeeded', isDefault: false },
    { name: 'failed', label: 'Failed', isDefault: false },
    { name: 'pending', label: 'Pending', isDefault: false },
  ],
  dateFilters: [
    {
      name: 'succeededAt',
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
    { name: 'status', type: 'String' },
    { name: 'providerName', type: 'String' },
    { name: 'currency', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 50_000,
    supportsCursor: false,
  },
  defaultSort: '-succeededAt',
};

/**
 * Create stateful MSW handlers for payments endpoints.
 * Handlers cover transactions, charges, refunds, payment methods, and checkout.
 *
 * @param baseUrl - API base path (default: `/api/v1/payments`)
 */
export function createPaymentsHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET /transactions/meta — query metadata
    createQueryMetaHandler(`${baseUrl}/transactions`, paymentTransactionQueryMetadata),

    // GET transactions for the current tenant
    http.get(`${baseUrl}/transactions/mine`, () => {
      return HttpResponse.json(sampleTransactions);
    }),

    // GET single transaction by ID (includes refunds + disputes)
    http.get(`${baseUrl}/transactions/:id`, ({ params }) => {
      const transaction = sampleTransactions.find((t) => t.id === params.id);
      if (!transaction) return notFound();
      return HttpResponse.json({
        ...transaction,
        refunds: sampleRefunds,
        disputes: sampleDisputes,
      });
    }),

    // POST charge
    http.post(`${baseUrl}/charge`, async ({ request }) => {
      const body = (await request.json()) as PaymentChargeRequest;
      return HttpResponse.json(
        {
          id: toEntityId<'PaymentTransaction'>(
            `txn_mock_${String(sampleTransactions.length + 1).padStart(3, '0')}`
          ),
          invoiceId: body.invoiceId,
          status: 'Processing',
          amount: body.amount,
          currency: body.currency as CurrencyCode,
          providerName: body.providerName,
          providerTransactionId: null,
          paymentMethodId: null,
          actionUrl: null,
          idempotencyKey: 'idem_mock',
          failureCode: null,
          succeededAt: null,
          canceledAt: null,
          refunds: [],
          disputes: [],
          tenantId: toEntityId<'Tenant'>('tenant_mock'),
        },
        { status: 201 }
      );
    }),

    // POST refund
    http.post(`${baseUrl}/transactions/:id/refund`, async ({ params, request }) => {
      const body = (await request.json()) as PaymentRefundRequest;
      return HttpResponse.json(
        {
          id: toEntityId<'PaymentRefund'>(
            `ref_mock_${String(sampleRefunds.length + 1).padStart(3, '0')}`
          ),
          transactionId: params.id,
          status: 'Pending',
          amount: body.amount,
          currency: 'EUR' as CurrencyCode,
          reason: body.reason,
          providerRefundId: null,
          createdAt: toISODateString(new Date().toISOString()),
          completedAt: null,
        },
        { status: 201 }
      );
    }),

    // GET payment methods for the current tenant
    http.get(`${baseUrl}/methods/mine`, () => {
      return HttpResponse.json(samplePaymentMethods);
    }),

    // GET available payment methods
    http.get(`${baseUrl}/methods/available`, () => {
      return HttpResponse.json(sampleAvailableMethods);
    }),

    // POST attach payment method
    http.post(`${baseUrl}/methods/attach`, async ({ request }) => {
      const body = (await request.json()) as PaymentAttachMethodRequest;
      return HttpResponse.json(
        {
          id: toEntityId<'PaymentMethod'>(
            `pm_mock_${String(samplePaymentMethods.length + 1).padStart(3, '0')}`
          ),
          type: body.type,
          providerName: body.providerName,
          providerMethodId: `pm_mock_${String(samplePaymentMethods.length + 1).padStart(3, '0')}`,
          displayLabel: body.type,
          isDefault: false,
          expiresAt: null,
          tenantId: toEntityId<'Tenant'>('tenant_mock'),
        },
        { status: 201 }
      );
    }),

    // DELETE payment method
    http.delete(`${baseUrl}/methods/:id`, () => {
      return noContent();
    }),

    // POST checkout session
    http.post(`${baseUrl}/checkout`, async ({ request }) => {
      const body = (await request.json()) as PaymentCheckoutRequest;
      return HttpResponse.json({
        sessionId: `cs_mock_${String(Date.now()).slice(-8)}`,
        url: `https://checkout.example.com/pay?amount=${body.amount}`,
      });
    }),
  ];
}
