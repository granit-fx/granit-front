import { createMswServer } from '@granit/testing/msw';
import { describe, expect, it } from 'vitest';

import { balanceTransactionQueryMetadata, createCustomerBalanceHandlers } from '../testing/index';

const BASE = 'http://api.test/api/v1/customer-balance';
const server = createMswServer();

describe('createCustomerBalanceHandlers /meta', () => {
  it('responds with balanceTransactionQueryMetadata at /transactions/meta', async () => {
    server.use(...createCustomerBalanceHandlers(BASE));
    const response = await fetch(`${BASE}/transactions/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(balanceTransactionQueryMetadata);
  });
});
