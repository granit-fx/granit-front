import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createSchedulingHandlers, scheduledActionQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1/scheduling';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createSchedulingHandlers /meta', () => {
  it('responds with scheduledActionQueryMetadata at /scheduled-actions/meta', async () => {
    server.use(...createSchedulingHandlers(BASE));
    const response = await fetch(`${BASE}/scheduled-actions/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(scheduledActionQueryMetadata);
  });
});
