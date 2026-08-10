import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import {
  createPaymentsHandlers,
  paymentTransactionQueryMetadata,
  sampleTransactions,
} from '../testing/index';

const BASE = 'http://api.test/api/v1/payments';
const server = createMswServer();

describe('createPaymentsHandlers /meta', () => {
  it('responds with paymentTransactionQueryMetadata at /transactions/meta', async () => {
    server.use(...createPaymentsHandlers(BASE));
    const response = await fetch(`${BASE}/transactions/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(paymentTransactionQueryMetadata);
  });
});

describe('createPaymentsHandlers /transactions', () => {
  it('responds with a PagedResult at the QueryEngine list route', async () => {
    server.use(...createPaymentsHandlers(BASE));
    const response = await fetch(`${BASE}/transactions?page=1&pageSize=20`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: sampleTransactions,
      totalCount: sampleTransactions.length,
    });
  });
});
