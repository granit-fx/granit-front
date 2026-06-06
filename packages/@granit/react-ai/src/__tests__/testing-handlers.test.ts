import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { aiWorkspaceQueryMetadata, createAIHandlers } from '../testing/index';

const BASE = 'http://api.test/api/v1/ai';
const server = createMswServer();

describe('createAIHandlers /meta', () => {
  it('responds with aiWorkspaceQueryMetadata at /workspaces/meta', async () => {
    server.use(...createAIHandlers(BASE));
    const response = await fetch(`${BASE}/workspaces/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(aiWorkspaceQueryMetadata);
  });
});
