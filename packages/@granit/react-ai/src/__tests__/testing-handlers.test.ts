import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { aiWorkspaceQueryMetadata, createAIHandlers } from '../testing/index.js';

const BASE = 'http://api.test/api/v1/ai';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createAIHandlers /meta', () => {
  it('responds with aiWorkspaceQueryMetadata at /workspaces/meta', async () => {
    server.use(...createAIHandlers(BASE));
    const response = await fetch(`${BASE}/workspaces/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(aiWorkspaceQueryMetadata);
  });
});
