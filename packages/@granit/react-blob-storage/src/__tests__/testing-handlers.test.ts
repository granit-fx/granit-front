import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { blobQueryMetadata, createBlobStorageHandlers } from '../testing/index.js';

const BASE = 'http://api.test/api/v1/blob-storage';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createBlobStorageHandlers /meta', () => {
  it('responds with blobQueryMetadata at /blobs/meta', async () => {
    server.use(...createBlobStorageHandlers(BASE));
    const response = await fetch(`${BASE}/blobs/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(blobQueryMetadata);
  });
});
