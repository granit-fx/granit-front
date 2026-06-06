import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { createTenantHandlers, tenantQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1/multi-tenancy';
const server = createMswServer();

describe('createTenantHandlers /meta', () => {
  it('responds with tenantQueryMetadata at /tenants/meta', async () => {
    server.use(...createTenantHandlers(BASE));
    const response = await fetch(`${BASE}/tenants/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(tenantQueryMetadata);
  });
});

describe('createTenantHandlers list', () => {
  it('responds with a PagedResult at GET /tenants', async () => {
    server.use(...createTenantHandlers(BASE));
    const response = await fetch(`${BASE}/tenants?page=1&pageSize=20`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { items: unknown[]; totalCount: number };
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.totalCount).toBe(body.items.length);
  });
});
