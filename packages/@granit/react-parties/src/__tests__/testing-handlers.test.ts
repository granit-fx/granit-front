import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { createPartiesHandlers, partyQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1/parties';
const server = createMswServer();

describe('createPartiesHandlers /meta', () => {
  it('responds with partyQueryMetadata at /meta', async () => {
    server.use(...createPartiesHandlers(BASE));
    const response = await fetch(`${BASE}/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(partyQueryMetadata);
  });
});
