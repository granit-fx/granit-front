import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createPaymentsHandlers, paymentTransactionQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1/payments';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createPaymentsHandlers /meta', () => {
  it('responds with paymentTransactionQueryMetadata at /transactions/meta', async () => {
    server.use(...createPaymentsHandlers(BASE));
    const response = await fetch(`${BASE}/transactions/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(paymentTransactionQueryMetadata);
  });
});
