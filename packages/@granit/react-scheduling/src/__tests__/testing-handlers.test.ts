import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { createSchedulingHandlers, scheduledActionQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1/scheduling';
const server = createMswServer();

describe('createSchedulingHandlers /meta', () => {
  it('responds with scheduledActionQueryMetadata at /scheduled-actions/meta', async () => {
    server.use(...createSchedulingHandlers(BASE));
    const response = await fetch(`${BASE}/scheduled-actions/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(scheduledActionQueryMetadata);
  });
});
