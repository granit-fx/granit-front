import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import {
  createDataExchangeHandlers,
  exportJobQueryMetadata,
  importJobQueryMetadata,
} from '../testing/index';

const METADATA_BASE = 'http://api.test/api/v1/data-exchange/metadata';
const IMPORT_BASE = 'http://api.test/api/v1/data-exchange/import';
const EXPORT_JOBS_BASE = 'http://api.test/api/v1/data-exchange/export/jobs';
const server = createMswServer();

describe('createDataExchangeHandlers /meta', () => {
  it('responds with exportJobQueryMetadata at exportJobsBase/meta', async () => {
    server.use(...createDataExchangeHandlers(METADATA_BASE, IMPORT_BASE, EXPORT_JOBS_BASE));
    const response = await fetch(`${EXPORT_JOBS_BASE}/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(exportJobQueryMetadata);
  });

  it('responds with importJobQueryMetadata at importBase/jobs/meta', async () => {
    server.use(...createDataExchangeHandlers(METADATA_BASE, IMPORT_BASE, EXPORT_JOBS_BASE));
    const response = await fetch(`${IMPORT_BASE}/jobs/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(importJobQueryMetadata);
  });
});
