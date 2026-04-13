import { noContent, notFound } from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import {
  sampleAvailableMethods,
  sampleDisputes,
  samplePaymentMethods,
  sampleRefunds,
  sampleTransactions,
} from './data.js';

import type {
  PaymentAttachMethodRequest,
  PaymentChargeRequest,
  PaymentCheckoutRequest,
  PaymentRefundRequest,
} from '@granit/payments';
import type { CurrencyCode } from '@granit/types';

/**
 * Create stateful MSW handlers for payments endpoints.
 * Handlers cover transactions, charges, refunds, payment methods, and checkout.
 *
 * @param baseUrl - API base path (default: `/api/v1/payments`)
 */
export function createPaymentsHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET all transactions
    http.get(`${baseUrl}/transactions`, () => {
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

    // GET payment methods
    http.get(`${baseUrl}/methods`, () => {
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
