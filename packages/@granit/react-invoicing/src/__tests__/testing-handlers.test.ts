import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createInvoicingHandlers, invoiceQueryMetadata } from '../testing/index.js';

const BASE = 'http://api.test/api/v1/invoicing';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createInvoicingHandlers /meta', () => {
  it('responds with invoiceQueryMetadata at /invoices/meta', async () => {
    server.use(...createInvoicingHandlers(BASE));
    const response = await fetch(`${BASE}/invoices/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(invoiceQueryMetadata);
  });
});
