import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { apiKeyQueryMetadata, createApiKeyHandlers } from '../testing/index';

const BASE = 'http://api.test/api/v1/authentication/api-keys';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createApiKeyHandlers /meta', () => {
  it('responds with apiKeyQueryMetadata at base/meta', async () => {
    server.use(...createApiKeyHandlers(BASE));
    const response = await fetch(`${BASE}/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(apiKeyQueryMetadata);
  });
});
