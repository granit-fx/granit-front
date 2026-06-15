import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { bankAccountQueryMetadata, createBankAccountsHandlers } from '../testing/index';

const BASE = 'http://api.test/api/v1/bank-accounts';
const server = createMswServer();

describe('createBankAccountsHandlers', () => {
  it('responds with bankAccountQueryMetadata at /meta', async () => {
    server.use(...createBankAccountsHandlers(BASE));
    const response = await fetch(`${BASE}/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(bankAccountQueryMetadata);
  });

  it('serves the QueryEngine admin grid (paged) at the base path', async () => {
    server.use(...createBankAccountsHandlers(BASE));
    const response = await fetch(BASE);
    expect(response.status).toBe(200);
    const page = (await response.json()) as { items: unknown[]; totalCount: number };
    expect(page.totalCount).toBe(page.items.length);
    expect(page.items.length).toBeGreaterThan(0);
  });

  it('lists only active accounts of a party at /by-party/:partyId', async () => {
    server.use(...createBankAccountsHandlers(BASE));
    const response = await fetch(`${BASE}/by-party/pty_001`);
    expect(response.status).toBe(200);
    const accounts = (await response.json()) as { partyId: string; status: string }[];
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts.every((a) => a.partyId === 'pty_001' && a.status === 'Active')).toBe(true);
  });

  it('registers a new account at POST / (masked identifier, starts unverified)', async () => {
    server.use(...createBankAccountsHandlers(BASE));
    const response = await fetch(BASE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        partyId: 'pty_001',
        scheme: 'Iban',
        accountIdentifier: 'BE68539007547034',
        holderName: 'Bob Roe',
        countryCode: 'BE',
      }),
    });
    expect(response.status).toBe(201);
    const created = (await response.json()) as {
      accountIdentifierMasked: string;
      verified: boolean;
    };
    expect(created.accountIdentifierMasked).toBe('**** 7034');
    expect(created.verified).toBe(false);
  });

  it('verifies an account at POST /:id/verify (idempotent)', async () => {
    server.use(...createBankAccountsHandlers(BASE));
    const verify = await fetch(`${BASE}/ba_002/verify`, { method: 'POST' });
    expect(verify.status).toBe(200);
    const verified = (await verify.json()) as { verified: boolean };
    expect(verified.verified).toBe(true);
  });

  it('archives an account at DELETE /:id and removes it from the party list', async () => {
    server.use(...createBankAccountsHandlers(BASE));
    const archive = await fetch(`${BASE}/ba_001`, { method: 'DELETE' });
    expect(archive.status).toBe(204);

    const after = (await (await fetch(`${BASE}/by-party/pty_001`)).json()) as { id: string }[];
    expect(after.some((a) => a.id === 'ba_001')).toBe(false);
  });

  it('returns 404 verifying an unknown account', async () => {
    server.use(...createBankAccountsHandlers(BASE));
    const response = await fetch(`${BASE}/missing/verify`, { method: 'POST' });
    expect(response.status).toBe(404);
  });
});
