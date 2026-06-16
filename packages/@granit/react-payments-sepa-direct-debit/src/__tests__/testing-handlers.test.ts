import { createMswServer } from '@granit/testing/msw-server';
import { toISODateString } from '@granit/types';
import { describe, expect, it } from 'vitest';

import { createSepaDirectDebitHandlers, mandateQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1/sepa-direct-debit';
const server = createMswServer();

describe('createSepaDirectDebitHandlers', () => {
  it('responds with mandateQueryMetadata at /mandates/meta', async () => {
    server.use(...createSepaDirectDebitHandlers(BASE));
    const response = await fetch(`${BASE}/mandates/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(mandateQueryMetadata);
  });

  it('returns the tenant configuration at /configuration', async () => {
    server.use(...createSepaDirectDebitHandlers(BASE));
    const response = await fetch(`${BASE}/configuration`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { creditorId: string };
    expect(body.creditorId).toBe('BE68ZZZ0123456789');
  });

  it('creates a mandate (201) carrying the requested redirect URL', async () => {
    server.use(...createSepaDirectDebitHandlers(BASE));
    const response = await fetch(`${BASE}/mandates`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        debtorPartyId: 'party-1',
        debtorName: 'Alice',
        debtorIban: 'BE68539007547034',
        redirectUrl: 'https://app.test/return',
      }),
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as { status: string; redirectUrl: string | null };
    expect(body.status).toBe('Pending');
    expect(body.redirectUrl).toBe('https://app.test/return');
  });

  it('confirms a known mandate to Active', async () => {
    server.use(...createSepaDirectDebitHandlers(BASE));
    const response = await fetch(`${BASE}/mandates/mdt_01/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ signedAt: toISODateString('2026-06-01T00:00:00Z') }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe('Active');
  });

  it('returns 404 for an unknown mandate', async () => {
    server.use(...createSepaDirectDebitHandlers(BASE));
    const response = await fetch(`${BASE}/mandates/does-not-exist`);
    expect(response.status).toBe(404);
  });
});
