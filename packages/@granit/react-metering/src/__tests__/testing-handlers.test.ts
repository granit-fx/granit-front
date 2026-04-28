import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createMeteringHandlers, meterQueryMetadata } from '../testing/index.js';

const BASE = 'http://api.test/api/v1/metering';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createMeteringHandlers /meta', () => {
  it('responds with meterQueryMetadata at /meters/meta', async () => {
    server.use(...createMeteringHandlers(BASE));
    const response = await fetch(`${BASE}/meters/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(meterQueryMetadata);
  });
});
