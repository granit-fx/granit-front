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
