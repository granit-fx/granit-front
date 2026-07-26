import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import {
  adminUserQueryMetadata,
  createOpenIddictAdminHandlers,
  oidcApplicationQueryMetadata,
  oidcAuthorizationQueryMetadata,
  oidcScopeQueryMetadata,
} from '../testing/index';

const BASE = 'http://api.test/api/v1/admin';
const server = createMswServer();

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

describe('createOpenIddictAdminHandlers PUT/POST mutations', () => {
  it('PUT /oidc/applications/:clientId updates the application', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const response = await fetch(`${BASE}/oidc/applications/granit-showcase-admin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Updated Name' }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.displayName).toBe('Updated Name');
    expect(body.clientId).toBe('granit-showcase-admin');
  });

  it('PUT /oidc/applications/:clientId returns 404 for unknown client', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const response = await fetch(`${BASE}/oidc/applications/unknown-client`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'X' }),
    });
    expect(response.status).toBe(404);
  });

  it('PUT /oidc/scopes/:name updates the scope', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const response = await fetch(`${BASE}/oidc/scopes/openid`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Updated description' }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.description).toBe('Updated description');
    expect(body.name).toBe('openid');
  });

  it('PUT /oidc/scopes/:name returns 404 for unknown scope', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const response = await fetch(`${BASE}/oidc/scopes/unknown-scope`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'X' }),
    });
    expect(response.status).toBe(404);
  });

  it('POST /oidc/authorizations creates a new authorization', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const response = await fetch(`${BASE}/oidc/authorizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'usr_01HZ9KQX0000000000001',
        clientId: 'granit-showcase-admin',
        scopes: ['openid', 'profile'],
      }),
    });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.subject).toBe('usr_01HZ9KQX0000000000001');
    expect(body.clientId).toBe('granit-showcase-admin');
    expect(body.status).toBe('valid');
  });

  it('POST /oidc/authorizations returns 404 for unknown clientId', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const response = await fetch(`${BASE}/oidc/authorizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'usr_01HZ9KQX0000000000001',
        clientId: 'unknown-client',
        scopes: ['openid'],
      }),
    });
    expect(response.status).toBe(404);
  });
});

describe('createOpenIddictAdminHandlers paged lists', () => {
  it('GET /oidc/applications returns a PagedResult envelope', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const response = await fetch(`${BASE}/oidc/applications`);
    const body = await response.json();

    expect(Array.isArray(body.items)).toBe(true);
    expect(body.totalCount).toBe(body.items.length);
    expect(body.hasMore).toBe(false);
  });

  it('GET /oidc/scopes returns a PagedResult envelope', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const body = await (await fetch(`${BASE}/oidc/scopes`)).json();

    expect(body.items.length).toBeGreaterThan(0);
    expect(body.totalCount).toBe(body.items.length);
  });

  it('honours page/pageSize and flags hasMore on a partial page', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const first = await (await fetch(`${BASE}/oidc/scopes?page=1&pageSize=1`)).json();

    expect(first.items).toHaveLength(1);
    expect(first.totalCount).toBeGreaterThan(1);
    expect(first.hasMore).toBe(true);

    const last = await (
      await fetch(`${BASE}/oidc/scopes?page=${String(first.totalCount)}&pageSize=1`)
    ).json();
    expect(last.hasMore).toBe(false);
  });

  it('returns an empty page past the end of the list', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const body = await (await fetch(`${BASE}/oidc/scopes?page=999&pageSize=25`)).json();

    expect(body.items).toEqual([]);
    expect(body.hasMore).toBe(false);
  });

  it('filters authorizations server-side by subject', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const body = await (
      await fetch(`${BASE}/oidc/authorizations?subject=usr_01HZ9KQX0000000000001`)
    ).json();

    expect(body.items.length).toBeGreaterThan(0);
    for (const item of body.items) {
      expect(item.subject).toBe('usr_01HZ9KQX0000000000001');
    }
  });

  it('returns an empty page for an unknown clientId filter', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const body = await (await fetch(`${BASE}/oidc/authorizations?clientId=does-not-exist`)).json();

    expect(body.items).toEqual([]);
    expect(body.totalCount).toBe(0);
  });
});

describe('createOpenIddictAdminHandlers client secret generation', () => {
  it('returns generatedClientSecret only when requested', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    const withSecret = await (
      await fetch(`${BASE}/oidc/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'generated-client', generateClientSecret: true }),
      })
    ).json();
    expect(withSecret.generatedClientSecret).toBeTruthy();

    const withoutSecret = await (
      await fetch(`${BASE}/oidc/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'plain-client' }),
      })
    ).json();
    expect(withoutSecret.generatedClientSecret).toBeUndefined();
  });

  it('never replays the generated secret on a later read', async () => {
    server.use(...createOpenIddictAdminHandlers(BASE));
    await fetch(`${BASE}/oidc/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: 'replay-client', generateClientSecret: true }),
    });

    const reread = await (await fetch(`${BASE}/oidc/applications/replay-client`)).json();
    expect(reread.generatedClientSecret).toBeUndefined();
  });
});
