import { createMswServer } from '@granit/testing/msw';
import { describe, expect, it } from 'vitest';

import {
  createPrivacyHandlers,
  legalDocumentQueryMetadata,
  privacyDeletionQueryMetadata,
  privacyExportQueryMetadata,
} from '../testing/index';

const BASE = 'http://api.test/api/v1/privacy';
const server = createMswServer();

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
