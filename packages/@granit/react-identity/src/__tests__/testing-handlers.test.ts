import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { createIdentityHandlers, identityUserQueryMetadata, mockUsers } from '../testing/index';

const PROVIDER_BASE = 'http://api.test/api/v1/identity/provider';
const CACHE_BASE = 'http://api.test/api/v1/identity/users';
const server = createMswServer();

describe('createIdentityHandlers /meta', () => {
  it('responds with identityUserQueryMetadata at cacheBase/meta', async () => {
    server.use(...createIdentityHandlers(PROVIDER_BASE, CACHE_BASE));
    const response = await fetch(`${CACHE_BASE}/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(identityUserQueryMetadata);
  });
});

describe('createIdentityHandlers cache sync + GDPR', () => {
  it('POST cacheBase/sync returns the refreshed user records', async () => {
    server.use(...createIdentityHandlers(PROVIDER_BASE, CACHE_BASE));
    const userId = mockUsers[0]!.userId;
    const response = await fetch(`${CACHE_BASE}/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userIds: [userId] }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as ReadonlyArray<{ userId: string }>;
    expect(body).toHaveLength(1);
    expect(body[0]!.userId).toBe(userId);
  });

  it('PATCH cacheBase/{userId}/pseudonymize responds 204', async () => {
    server.use(...createIdentityHandlers(PROVIDER_BASE, CACHE_BASE));
    const response = await fetch(`${CACHE_BASE}/${mockUsers[0]!.userId}/pseudonymize`, {
      method: 'PATCH',
    });
    expect(response.status).toBe(204);
  });
});
