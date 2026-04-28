import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createWebhooksHandlers, webhookSubscriptionQueryMetadata } from '../testing/index.js';

const BASE = 'http://api.test/api/v1/webhooks';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createWebhooksHandlers /meta', () => {
  it('responds with webhookSubscriptionQueryMetadata at /subscriptions/meta', async () => {
    server.use(...createWebhooksHandlers(BASE));
    const response = await fetch(`${BASE}/subscriptions/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(webhookSubscriptionQueryMetadata);
  });
});
