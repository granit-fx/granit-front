import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  createSubscriptionsHandlers,
  planQueryMetadata,
  subscriptionQueryMetadata,
} from '../testing/index';

const BASE = 'http://api.test/api/v1/subscriptions';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createSubscriptionsHandlers /meta', () => {
  it('responds with planQueryMetadata at /plans/meta', async () => {
    server.use(...createSubscriptionsHandlers(BASE));
    const response = await fetch(`${BASE}/plans/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(planQueryMetadata);
  });

  it('responds with subscriptionQueryMetadata at /subscriptions/meta', async () => {
    server.use(...createSubscriptionsHandlers(BASE));
    const response = await fetch(`${BASE}/subscriptions/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(subscriptionQueryMetadata);
  });
});
