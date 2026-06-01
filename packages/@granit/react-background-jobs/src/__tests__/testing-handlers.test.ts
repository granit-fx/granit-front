import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { backgroundJobQueryMetadata, createBackgroundJobHandlers } from '../testing/index';

const BASE = 'http://api.test/api/v1/background-jobs';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createBackgroundJobHandlers /meta', () => {
  it('responds with backgroundJobQueryMetadata at /jobs/meta', async () => {
    server.use(...createBackgroundJobHandlers(BASE));
    const response = await fetch(`${BASE}/jobs/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(backgroundJobQueryMetadata);
  });
});
