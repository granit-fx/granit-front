import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { createSepaTransferHandlers } from '../testing/index';

const BASE = 'http://api.test/api/v1/sepa-transfer';
const server = createMswServer();

describe('createSepaTransferHandlers', () => {
  it('returns the tenant configuration at /configuration', async () => {
    server.use(...createSepaTransferHandlers(BASE));
    const response = await fetch(`${BASE}/configuration`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { beneficiaryIbanMasked: string };
    expect(body.beneficiaryIbanMasked).toBe('BE** **** **** 9999');
  });

  it('upserts and echoes the beneficiary name without leaking the raw IBAN', async () => {
    server.use(...createSepaTransferHandlers(BASE));
    const response = await fetch(`${BASE}/configuration`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ beneficiaryName: 'Bravo BV', beneficiaryIban: 'BE68539007547034' }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.beneficiaryName).toBe('Bravo BV');
    expect(body).not.toHaveProperty('beneficiaryIban');
    expect(body.beneficiaryIbanMasked).toBe('BE** **** **** 9999');
  });
});
