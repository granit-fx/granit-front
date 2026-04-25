import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { sampleBalance, sampleTransactions } from './data.js';

import type { AdminCreditRequest, AdminDebitRequest } from '@granit/customer-balance';

/**
 * Create stateful MSW handlers for customer balance endpoints.
 * Credit mutations update the in-memory balance amount.
 *
 * @param baseUrl - API base path (default: `/api/v1/customer-balance`)
 */
export function createCustomerBalanceHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET current balance
    http.get(baseUrl, () => {
      return HttpResponse.json(sampleBalance);
    }),

    // GET transaction history
    http.get(`${baseUrl}/transactions`, () => {
      return HttpResponse.json(sampleTransactions);
    }),

    // POST admin credit
    http.post(`${baseUrl}/credit`, async ({ request }) => {
      const body = (await request.json()) as AdminCreditRequest;
      sampleBalance.balance = sampleBalance.balance + body.amount;
      sampleBalance.updatedAt = toISODateString(new Date().toISOString());
      return HttpResponse.json({ ...sampleBalance }, { status: 201 });
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
