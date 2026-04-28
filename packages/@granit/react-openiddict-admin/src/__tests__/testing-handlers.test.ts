import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  adminUserQueryMetadata,
  createOpenIddictAdminHandlers,
  oidcApplicationQueryMetadata,
  oidcAuthorizationQueryMetadata,
  oidcScopeQueryMetadata,
} from '../testing/index.js';

const BASE = 'http://api.test/api/v1/admin';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createOpenIddictAdminHandlers /meta', () => {
  it('responds with adminUserQueryMetadata at /users/meta', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const response = await fetch(`${BASE}/users/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(adminUserQueryMetadata);
  });

  it('responds with oidcApplicationQueryMetadata at /oidc/applications/meta', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const response = await fetch(`${BASE}/oidc/applications/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(oidcApplicationQueryMetadata);
  });

  it('responds with oidcScopeQueryMetadata at /oidc/scopes/meta', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const response = await fetch(`${BASE}/oidc/scopes/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(oidcScopeQueryMetadata);
  });

  it('responds with oidcAuthorizationQueryMetadata at /oidc/authorizations/meta', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const response = await fetch(`${BASE}/oidc/authorizations/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(oidcAuthorizationQueryMetadata);
  });
});
