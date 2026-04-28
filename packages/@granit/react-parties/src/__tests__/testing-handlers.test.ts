import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createPartiesHandlers, partyQueryMetadata } from '../testing/index.js';

const BASE = 'http://api.test/api/v1/parties';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createPartiesHandlers /meta', () => {
  it('responds with partyQueryMetadata at /meta', async () => {
    server.use(...createPartiesHandlers(BASE));
    const response = await fetch(`${BASE}/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(partyQueryMetadata);
  });
});
