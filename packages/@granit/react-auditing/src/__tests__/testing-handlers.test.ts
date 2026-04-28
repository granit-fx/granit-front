import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { auditEntryQueryMetadata, createAuditHandlers } from '../testing/index.js';

const BASE = 'http://api.test/api/v1/auditing';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createAuditHandlers /meta', () => {
  it('responds with auditEntryQueryMetadata at /audit-entries/meta', async () => {
    server.use(...createAuditHandlers(BASE));
    const response = await fetch(`${BASE}/audit-entries/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(auditEntryQueryMetadata);
  });
});
