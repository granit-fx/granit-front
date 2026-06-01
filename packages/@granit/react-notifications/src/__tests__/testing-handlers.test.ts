import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createNotificationsHandlers, notificationQueryMetadata } from '../testing/index';

const BASE = 'http://api.test/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createNotificationsHandlers /meta', () => {
  it('responds with notificationQueryMetadata at /notifications/meta', async () => {
    server.use(...createNotificationsHandlers(BASE));
    const response = await fetch(`${BASE}/notifications/meta`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(notificationQueryMetadata);
  });
});
