import { createMswServer } from '@granit/testing/msw';
import { describe, expect, it } from 'vitest';

import { createInvoicingHandlers, invoiceQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1/invoicing';
const server = createMswServer();

describe('createInvoicingHandlers /meta', () => {
  it('responds with invoiceQueryMetadata at /invoices/meta', async () => {
    server.use(...createInvoicingHandlers(BASE));
    const response = await fetch(`${BASE}/invoices/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(invoiceQueryMetadata);
  });
});
