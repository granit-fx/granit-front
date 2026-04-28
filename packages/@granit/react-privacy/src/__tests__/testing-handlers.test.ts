import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  createPrivacyHandlers,
  legalDocumentQueryMetadata,
  privacyDeletionQueryMetadata,
  privacyExportQueryMetadata,
} from '../testing/index.js';

const BASE = 'http://api.test/api/v1/privacy';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createPrivacyHandlers /meta', () => {
  it('responds with privacyExportQueryMetadata at /exports/meta', async () => {
    server.use(...createPrivacyHandlers(BASE));
    const response = await fetch(`${BASE}/exports/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(privacyExportQueryMetadata);
  });

  it('responds with privacyDeletionQueryMetadata at /deletions/meta', async () => {
    server.use(...createPrivacyHandlers(BASE));
    const response = await fetch(`${BASE}/deletions/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(privacyDeletionQueryMetadata);
  });

  it('responds with legalDocumentQueryMetadata at /legal-documents/meta', async () => {
    server.use(...createPrivacyHandlers(BASE));
    const response = await fetch(`${BASE}/legal-documents/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(legalDocumentQueryMetadata);
  });
});
