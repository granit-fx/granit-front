import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { createApiKeyHandlers } from '../testing/index';

const BASE = 'http://api.test/api/v1/authentication/api-keys';
const server = createMswServer();

describe('createApiKeyHandlers', () => {
  it('returns a PagedResult shape (items + totalCount + hasMore) from the list endpoint', async () => {
    server.use(...createApiKeyHandlers(BASE));
    const response = await fetch(BASE);

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      items: unknown[];
      totalCount: number;
      hasMore: boolean;
    };
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.totalCount).toBe('number');
    expect(typeof body.hasMore).toBe('boolean');
    expect(body.items.length).toBeGreaterThan(0);
  });

  it('returns summary rows without permissions/allowedCidrs', async () => {
    server.use(...createApiKeyHandlers(BASE));
    const body = (await (await fetch(BASE)).json()) as {
      items: Record<string, unknown>[];
    };

    const row = body.items[0]!;
    expect(row).toHaveProperty('lastFourChars');
    expect(row).not.toHaveProperty('permissions');
    expect(row).not.toHaveProperty('allowedCidrs');
  });

  it('hides revoked keys by default and surfaces them with quickFilters=includeRevoked', async () => {
    server.use(...createApiKeyHandlers(BASE));

    const active = (await (await fetch(BASE)).json()) as { items: { revokedAt: string | null }[] };
    expect(active.items.every((k) => k.revokedAt === null)).toBe(true);

    const withRevoked = (await (await fetch(`${BASE}?quickFilters=includeRevoked`)).json()) as {
      items: { revokedAt: string | null }[];
    };
    expect(withRevoked.items.some((k) => k.revokedAt !== null)).toBe(true);
  });

  it('filters by a single type via filter[type.eq]', async () => {
    server.use(...createApiKeyHandlers(BASE));
    const response = await fetch(
      `${BASE}?${new URLSearchParams({ 'filter[type.Eq]': 'Secret' }).toString()}`
    );
    const body = (await response.json()) as { items: { type: string }[] };

    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((k) => k.type === 'Secret')).toBe(true);
  });

  it('searches on the name only', async () => {
    server.use(...createApiKeyHandlers(BASE));
    const body = (await (await fetch(`${BASE}?search=Patient`)).json()) as {
      items: { name: string }[];
    };

    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((k) => k.name.toLowerCase().includes('patient'))).toBe(true);
  });

  it('exposes QueryEngine metadata at /meta', async () => {
    server.use(...createApiKeyHandlers(BASE));
    const response = await fetch(`${BASE}/meta`);

    expect(response.status).toBe(200);
    const meta = (await response.json()) as {
      quickFilters: { name: string }[];
      defaultSort: string;
    };
    expect(meta.quickFilters.map((q) => q.name)).toContain('includeRevoked');
    expect(meta.defaultSort).toBe('-createdAt');
  });

  it('revoke returns 204 No Content', async () => {
    server.use(...createApiKeyHandlers(BASE));
    const list = (await (await fetch(BASE)).json()) as {
      items: { id: string }[];
    };
    const id = list.items[0]!.id;

    const response = await fetch(`${BASE}/${id}/revoke`, { method: 'POST' });
    expect(response.status).toBe(204);
  });
});
