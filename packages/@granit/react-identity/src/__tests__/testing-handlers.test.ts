import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createIdentityHandlers, identityUserQueryMetadata } from '../testing/index.js';

const PROVIDER_BASE = 'http://api.test/api/v1/identity/provider';
const CACHE_BASE = 'http://api.test/api/v1/identity/users';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createIdentityHandlers /meta', () => {
  it('responds with identityUserQueryMetadata at cacheBase/meta', async () => {
    server.use(...createIdentityHandlers(PROVIDER_BASE, CACHE_BASE));
    const response = await fetch(`${CACHE_BASE}/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(identityUserQueryMetadata);
  });
});
