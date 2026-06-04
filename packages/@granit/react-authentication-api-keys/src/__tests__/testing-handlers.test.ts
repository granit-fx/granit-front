import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createApiKeyHandlers } from '../testing/index';

const BASE = 'http://api.test/api/v1/authentication/api-keys';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createApiKeyHandlers', () => {
  it('returns a PagedResult shape (items + totalCount) from the list endpoint', async () => {
    server.use(...createApiKeyHandlers(BASE));
    const response = await fetch(BASE);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { items: unknown[]; totalCount: number };
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.totalCount).toBe('number');
    expect(body.items.length).toBeGreaterThan(0);
  });

  it('filters by a single type value', async () => {
    server.use(...createApiKeyHandlers(BASE));
    const response = await fetch(`${BASE}?type=Secret`);
    const body = (await response.json()) as { items: { type: string }[] };

    expect(body.items.every((k) => k.type === 'Secret')).toBe(true);
  });

  it('revoke returns 204 No Content', async () => {
    server.use(...createApiKeyHandlers(BASE));
    const list = (await (await fetch(`${BASE}?includeRevoked=false`)).json()) as {
      items: { id: string }[];
    };
    const id = list.items[0]!.id;

    const response = await fetch(`${BASE}/${id}/revoke`, { method: 'POST' });
    expect(response.status).toBe(204);
  });
});
